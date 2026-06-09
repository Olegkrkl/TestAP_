from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import CurrentUser, TeacherUser
from app.models.test import Test
from app.models.question import Question
from app.models.group import GroupMember
from app.schemas.test import TestCreate, TestUpdate, TestOut, TestDetail, QuestionCreate, QuestionUpdate, QuestionOut

router = APIRouter(prefix="/tests", tags=["tests"])


async def _test_out(test: Test, db: AsyncSession) -> TestOut:
    cnt = await db.execute(select(func.count()).select_from(Question).where(Question.test_id == test.id))
    return TestOut(
        **{c: getattr(test, c) for c in [
            "id", "title", "description", "author_id", "group_id", "time_limit", "per_question_timer",
            "attempts_allowed", "shuffle_questions", "shuffle_answers", "show_answers_after",
            "passing_score", "opens_at", "closes_at", "copy_protection", "tab_switch_detection",
            "status", "is_training", "partial_scoring", "tags", "category", "created_at", "updated_at",
        ]},
        question_count=cnt.scalar() or 0,
    )


@router.post("/", response_model=TestOut, status_code=201)
async def create_test(data: TestCreate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    test = Test(**data.model_dump(), author_id=current_user.id)
    db.add(test)
    await db.flush()
    return await _test_out(test, db)


@router.get("/", response_model=List[TestOut])
async def list_tests(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    group_id: Optional[str] = Query(None),
    is_training: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 50,
):
    if current_user.role == "student":
        # Students see published tests assigned to their groups OR training tests they own
        group_ids_r = await db.execute(
            select(GroupMember.group_id).where(GroupMember.user_id == current_user.id)
        )
        gids = [r[0] for r in group_ids_r.all()]
        query = select(Test).where(
            ((Test.group_id.in_(gids)) & (Test.status == "published")) |
            ((Test.is_training == True) & (Test.author_id == current_user.id))
        )
    elif current_user.role == "teacher":
        query = select(Test).where(Test.author_id == current_user.id)
    else:
        query = select(Test)

    if search:
        query = query.where(Test.title.ilike(f"%{search}%"))
    if status:
        query = query.where(Test.status == status)
    if category:
        query = query.where(Test.category == category)
    if group_id:
        query = query.where(Test.group_id == group_id)
    if is_training is not None:
        query = query.where(Test.is_training == is_training)

    query = query.offset(skip).limit(limit).order_by(Test.created_at.desc())
    result = await db.execute(query)
    tests = result.scalars().all()
    return [await _test_out(t, db) for t in tests]


@router.get("/calendar")
async def calendar_tests(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Return tests with closes_at or opens_at for the current student's groups (for calendar view)."""
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import or_

    if current_user.role == "student":
        group_ids_r = await db.execute(
            select(GroupMember.group_id).where(GroupMember.user_id == current_user.id)
        )
        gids = [r[0] for r in group_ids_r.all()]
        query = select(Test).where(
            Test.group_id.in_(gids),
            Test.status == "published",
            or_(Test.closes_at.isnot(None), Test.opens_at.isnot(None)),
        )
    else:
        query = select(Test).where(
            Test.author_id == current_user.id,
            or_(Test.closes_at.isnot(None), Test.opens_at.isnot(None)),
        )

    result = await db.execute(query.order_by(Test.closes_at.asc().nulls_last()))
    tests = result.scalars().all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "closes_at": t.closes_at.isoformat() if t.closes_at else None,
            "opens_at": t.opens_at.isoformat() if t.opens_at else None,
            "group_id": t.group_id,
            "status": t.status,
        }
        for t in tests
    ]


@router.get("/{test_id}/preview")
async def get_test_preview(test_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Lightweight metadata for a test, shown to students BEFORE starting a
    session. Returns no question content/correct answers — only counts, rules,
    and attempt info so the user can decide to start.
    """
    from datetime import datetime, timezone
    test_r = await db.execute(select(Test).where(Test.id == test_id))
    test = test_r.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    # Access check: students must own a training test, or belong to the test's group.
    if current_user.role == "student":
        if test.is_training:
            if test.author_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized")
        elif test.status != "published":
            raise HTTPException(status_code=403, detail="Test is not available")
        elif test.group_id:
            membership = await db.execute(
                select(GroupMember).where(
                    GroupMember.group_id == test.group_id,
                    GroupMember.user_id == current_user.id,
                )
            )
            if not membership.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="You are not a member of this test's group")

    q_cnt_r = await db.execute(select(func.count()).select_from(Question).where(Question.test_id == test_id))
    question_count = q_cnt_r.scalar() or 0

    points_r = await db.execute(select(func.coalesce(func.sum(Question.points), 0)).where(Question.test_id == test_id))
    total_points = int(points_r.scalar() or 0)

    from app.models.session import TestSession as _S
    from app.models.result import Result as _R
    attempts_used_r = await db.execute(
        select(func.count()).select_from(_S).where(
            _S.user_id == current_user.id,
            _S.test_id == test_id,
            _S.status == "completed",
        )
    )
    attempts_used = attempts_used_r.scalar() or 0

    in_progress_r = await db.execute(
        select(_S).where(
            _S.user_id == current_user.id,
            _S.test_id == test_id,
            _S.status == "in_progress",
        )
    )
    in_progress = in_progress_r.scalar_one_or_none()

    best_r = await db.execute(
        select(func.max(_R.percent)).where(_R.user_id == current_user.id, _R.test_id == test_id)
    )
    best_percent = best_r.scalar()

    now = datetime.now(timezone.utc)
    is_open = True
    if test.opens_at and now < test.opens_at:
        is_open = False
    if test.closes_at and now > test.closes_at:
        is_open = False

    return {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "category": test.category,
        "tags": test.tags,
        "question_count": question_count,
        "total_points": total_points,
        "time_limit": test.time_limit,
        "per_question_timer": test.per_question_timer,
        "attempts_allowed": test.attempts_allowed,
        "attempts_used": attempts_used,
        "attempts_unlimited": test.attempts_allowed is None or test.attempts_allowed <= 0,
        "passing_score": test.passing_score,
        "shuffle_questions": test.shuffle_questions,
        "shuffle_answers": test.shuffle_answers,
        "show_answers_after": test.show_answers_after,
        "copy_protection": test.copy_protection,
        "tab_switch_detection": test.tab_switch_detection,
        "opens_at": test.opens_at.isoformat() if test.opens_at else None,
        "closes_at": test.closes_at.isoformat() if test.closes_at else None,
        "is_training": test.is_training,
        "status": test.status,
        "is_open": is_open,
        "has_in_progress_session": in_progress is not None,
        "in_progress_session_id": in_progress.id if in_progress else None,
        "best_percent": float(best_percent) if best_percent is not None else None,
    }


@router.get("/{test_id}/detail", response_model=TestDetail)
async def get_test_detail(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    questions_r = await db.execute(select(Question).where(Question.test_id == test_id).order_by(Question.order_index))
    questions = [QuestionOut.model_validate(q) for q in questions_r.scalars().all()]
    base = await _test_out(test, db)
    return TestDetail(**base.model_dump(), questions=questions)


@router.get("/{test_id}", response_model=TestDetail)
async def get_test(test_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    questions_r = await db.execute(select(Question).where(Question.test_id == test_id).order_by(Question.order_index))
    questions = [QuestionOut.model_validate(q) for q in questions_r.scalars().all()]
    base = await _test_out(test, db)
    return TestDetail(**base.model_dump(), questions=questions)


@router.patch("/{test_id}", response_model=TestOut)
async def update_test(test_id: str, data: TestUpdate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(test, field, value)
    return await _test_out(test, db)


@router.delete("/{test_id}", status_code=204)
async def delete_test(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(test)


@router.post("/{test_id}/publish", response_model=TestOut)
async def publish_test(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.status = "published"
    return await _test_out(test, db)


@router.post("/{test_id}/archive", response_model=TestOut)
async def archive_test(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    test.status = "archived"
    return await _test_out(test, db)


@router.post("/{test_id}/copy", response_model=TestOut, status_code=201)
async def copy_test(test_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    new_test = Test(
        title=f"{test.title} (копія)",
        description=test.description,
        author_id=current_user.id,
        time_limit=test.time_limit,
        per_question_timer=test.per_question_timer,
        attempts_allowed=test.attempts_allowed,
        shuffle_questions=test.shuffle_questions,
        shuffle_answers=test.shuffle_answers,
        show_answers_after=test.show_answers_after,
        passing_score=test.passing_score,
        copy_protection=test.copy_protection,
        tab_switch_detection=test.tab_switch_detection,
        is_training=test.is_training,
        tags=test.tags,
        category=test.category,
        status="draft",
    )
    db.add(new_test)
    await db.flush()
    q_result = await db.execute(select(Question).where(Question.test_id == test_id))
    for q in q_result.scalars().all():
        db.add(Question(
            test_id=new_test.id, type=q.type, content=q.content,
            hint=q.hint, explanation=q.explanation, points=q.points,
            order_index=q.order_index, time_limit=q.time_limit, options=q.options,
        ))
    return await _test_out(new_test, db)


# Questions CRUD
@router.post("/{test_id}/questions", response_model=QuestionOut, status_code=201)
async def add_question(test_id: str, data: QuestionCreate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    q = Question(test_id=test_id, **data.model_dump())
    db.add(q)
    await db.flush()
    return QuestionOut.model_validate(q)


@router.patch("/{test_id}/questions/{question_id}", response_model=QuestionOut)
async def update_question(test_id: str, question_id: str, data: QuestionUpdate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id, Question.test_id == test_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    return QuestionOut.model_validate(q)


@router.delete("/{test_id}/questions/{question_id}", status_code=204)
async def delete_question(test_id: str, question_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id, Question.test_id == test_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
