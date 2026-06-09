"""Session management and auto-submission service."""
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.session import TestSession
from app.models.test import Test
from app.models.result import Result
from app.models.question import Question
from app.services.grading import grade_answer, grade_answer_partial, get_correct_answer


async def get_remaining_seconds(session: TestSession, test: Test) -> Optional[int]:
    if not test.time_limit:
        return None
    elapsed = (datetime.now(timezone.utc) - session.started_at).total_seconds()
    remaining = test.time_limit * 60 - int(elapsed)
    return max(0, remaining)


async def get_resume_session(
    db: AsyncSession,
    user_id: str,
    test_id: str,
    *,
    cleanup_duplicates: bool = True,
) -> Optional[TestSession]:
    """Return the newest in-progress session for a user/test pair.

    React Strict Mode (and other double-mount races) can create duplicate
    in-progress rows; keep the latest and drop the rest so callers never hit
    MultipleResultsFound.
    """
    result = await db.execute(
        select(TestSession)
        .where(
            TestSession.user_id == user_id,
            TestSession.test_id == test_id,
            TestSession.status == "in_progress",
        )
        .order_by(TestSession.started_at.desc())
    )
    sessions = result.scalars().all()
    if not sessions:
        return None

    active = sessions[0]
    if cleanup_duplicates and len(sessions) > 1:
        for stale in sessions[1:]:
            await db.delete(stale)
    return active


async def auto_submit_expired_sessions(db: AsyncSession) -> int:
    """Auto-submit in-progress sessions in two cases:

    1) Test has a time_limit and the timer has expired.
    2) Test has no time_limit but the session has been idle longer than
       SESSION_IDLE_TIMEOUT_MINUTES (default 6h) — covers the case where the
       student closed the browser without submitting.

    Returns the number of sessions finalized.
    """
    # Single JOIN pulls each in-progress session together with its test, so the
    # per-minute job runs one query instead of 1 + N (one extra SELECT per
    # session). The ix_test_sessions_status partial index keeps the scan cheap.
    result = await db.execute(
        select(TestSession, Test)
        .join(Test, Test.id == TestSession.test_id)
        .where(TestSession.status == "in_progress")
    )
    rows = result.all()
    submitted = 0
    now = datetime.now(timezone.utc)
    idle_cutoff = timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)

    for sess, test in rows:
        if test.time_limit:
            remaining = await get_remaining_seconds(sess, test)
            if remaining is not None and remaining <= 0:
                await submit_session(db, sess, test)
                submitted += 1
                continue

        # Idle timeout — finalize sessions that haven't seen any interaction
        # for longer than the configured idle window. Uses last_action_at so
        # active long-running sessions are NOT killed.
        anchor = sess.last_action_at or sess.started_at
        if anchor and (now - anchor) > idle_cutoff:
            await submit_session(db, sess, test)
            submitted += 1

    return submitted


async def submit_session(db: AsyncSession, session: TestSession, test: Test) -> Result:
    """Score and finalize a session."""
    questions_result = await db.execute(
        select(Question).where(Question.test_id == test.id)
    )
    questions = questions_result.scalars().all()

    per_question_stats = []
    total_score = 0
    max_score = 0

    for q in questions:
        max_score += q.points
        user_answer = session.answers.get(q.id)
        if test.partial_scoring:
            fraction = grade_answer_partial(q.type, q.options, user_answer)
            points_earned = round(q.points * fraction, 2)
            is_correct = fraction == 1.0
        else:
            is_correct = grade_answer(q.type, q.options, user_answer)
            points_earned = q.points if is_correct else 0
        total_score += points_earned
        per_question_stats.append({
            "question_id": q.id,
            "correct": is_correct,
            "points_earned": points_earned,
            "points_possible": q.points,
            "user_answer": user_answer,
            "correct_answer": get_correct_answer(q.type, q.options),
            "question_content": q.content,
            "question_type": q.type,
            "hint_used": q.id in (session.hint_used or []),
            "explanation": q.explanation,
        })

    percent = (total_score / max_score * 100) if max_score > 0 else 0
    passed = percent >= test.passing_score

    session.status = "completed"
    session.score = total_score
    session.completed_at = datetime.now(timezone.utc)

    result = Result(
        session_id=session.id,
        user_id=session.user_id,
        test_id=session.test_id,
        score=total_score,
        max_score=max_score,
        percent=round(percent, 2),
        passed=passed,
        per_question_stats=per_question_stats,
    )
    db.add(result)
    await db.flush()
    return result
