from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List
from app.core.database import get_db
from app.core.deps import CurrentUser
from app.models.session import TestSession
from app.models.test import Test
from app.models.result import Result
from app.models.user import User
from app.schemas.session import (
    SessionStart, AnswerSave, SessionOut, TimeRemaining,
    ViolationReport, ResultOut, QuestionStatOut, FlagQuestion
)
from app.services.session_service import get_remaining_seconds, submit_session
from app.services.badge_service import check_and_award_badges

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionOut)
async def start_session(data: SessionStart, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    test_r = await db.execute(select(Test).where(Test.id == data.test_id))
    test = test_r.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.status != "published" and not test.is_training:
        raise HTTPException(status_code=400, detail="Test is not available")

    # Check if there's an existing in-progress session
    existing = await db.execute(
        select(TestSession).where(
            TestSession.user_id == current_user.id,
            TestSession.test_id == data.test_id,
            TestSession.status == "in_progress",
        )
    )
    sess = existing.scalar_one_or_none()
    if sess:
        return SessionOut.model_validate(sess)

    # Check attempt count. Treat None or <=0 as "unlimited attempts".
    if test.attempts_allowed and test.attempts_allowed > 0:
        completed_count_r = await db.execute(
            select(func.count()).select_from(TestSession).where(
                TestSession.user_id == current_user.id,
                TestSession.test_id == data.test_id,
                TestSession.status == "completed",
            )
        )
        completed_count = completed_count_r.scalar() or 0
        if completed_count >= test.attempts_allowed:
            raise HTTPException(status_code=400, detail="Maximum attempts reached")

    sess = TestSession(user_id=current_user.id, test_id=data.test_id)
    db.add(sess)
    await db.flush()
    return SessionOut.model_validate(sess)


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut.model_validate(sess)


@router.get("/{session_id}/remaining", response_model=TimeRemaining)
async def get_remaining(session_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.status == "completed":
        return TimeRemaining(remaining_seconds=0, total_seconds=None)
    test_r = await db.execute(select(Test).where(Test.id == sess.test_id))
    test = test_r.scalar_one_or_none()
    remaining = await get_remaining_seconds(sess, test)
    total = test.time_limit * 60 if test.time_limit else None
    # Auto-submit if expired
    if remaining is not None and remaining <= 0:
        await submit_session(db, sess, test)
    else:
        # Treat the timer poll as a heartbeat so an actively-open tab never
        # falls into the idle-timeout auto-submit branch.
        sess.last_action_at = datetime.now(timezone.utc)
    return TimeRemaining(remaining_seconds=remaining, total_seconds=total)


@router.patch("/{session_id}/answers", response_model=SessionOut)
async def save_answer(session_id: str, data: AnswerSave, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.status == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")
    answers = dict(sess.answers or {})
    answers[data.question_id] = data.answer
    sess.answers = answers
    return SessionOut.model_validate(sess)


@router.patch("/{session_id}/flag", response_model=SessionOut)
async def flag_question(session_id: str, data: FlagQuestion, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    flagged = list(sess.flagged or [])
    if data.question_id in flagged:
        flagged.remove(data.question_id)
    else:
        flagged.append(data.question_id)
    sess.flagged = flagged
    return SessionOut.model_validate(sess)


@router.post("/{session_id}/violation", response_model=SessionOut)
async def report_violation(session_id: str, data: ViolationReport, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    sess.violations = (sess.violations or 0) + 1
    return SessionOut.model_validate(sess)


@router.post("/{session_id}/hint/{question_id}", response_model=SessionOut)
async def use_hint(session_id: str, question_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    hint_used = list(sess.hint_used or [])
    if question_id not in hint_used:
        hint_used.append(question_id)
    sess.hint_used = hint_used
    return SessionOut.model_validate(sess)


@router.post("/{session_id}/submit", response_model=ResultOut)
async def submit_test(session_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = result.scalar_one_or_none()
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.status == "completed":
        result_r = await db.execute(select(Result).where(Result.session_id == sess.id))
        res = result_r.scalar_one_or_none()
        if res:
            return _result_out(res, sess)
        raise HTTPException(status_code=400, detail="Session already completed")

    test_r = await db.execute(select(Test).where(Test.id == sess.test_id))
    test = test_r.scalar_one_or_none()
    res = await submit_session(db, sess, test)

    # Update user streak — count by calendar date, not raw 24-hour windows.
    # Submitting today after yesterday at any time should extend the streak by 1.
    user_r = await db.execute(select(User).where(User.id == current_user.id))
    user = user_r.scalar_one_or_none()
    if user:
        now = datetime.now(timezone.utc)
        today = now.date()
        if user.last_activity is None:
            user.streak_days = 1
        else:
            last_day = user.last_activity.date()
            delta = (today - last_day).days
            if delta == 0:
                # Same day — keep streak unchanged (at least 1).
                if user.streak_days <= 0:
                    user.streak_days = 1
            elif delta == 1:
                user.streak_days = (user.streak_days or 0) + 1
            else:
                # Missed one or more days → start over.
                user.streak_days = 1
        user.last_activity = now
        await check_and_award_badges(db, current_user.id, res.percent, user.streak_days)

    return _result_out(res, sess)


def _result_out(res: Result, sess: TestSession) -> ResultOut:
    stats = [QuestionStatOut(**s) for s in (res.per_question_stats or [])]
    return ResultOut(
        id=res.id, session_id=res.session_id, user_id=res.user_id, test_id=res.test_id,
        score=res.score, max_score=res.max_score, percent=res.percent, passed=res.passed,
        per_question_stats=stats, completed_at=res.completed_at,
        violations=sess.violations or 0,
    )


@router.get("/{session_id}/result", response_model=ResultOut)
async def get_result(session_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Result).where(Result.session_id == session_id))
    res = result.scalar_one_or_none()
    if not res or res.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Result not found")
    sess_r = await db.execute(select(TestSession).where(TestSession.id == session_id))
    sess = sess_r.scalar_one_or_none()
    return _result_out(res, sess)
