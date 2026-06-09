from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import CurrentUser, TeacherUser, AdminUser
from app.models.user import User
from app.models.test import Test
from app.models.result import Result
from app.models.session import TestSession
from app.models.group import Group, GroupMember
from app.schemas.misc import StudentStats, TeacherStats, AdminStats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/student", response_model=StudentStats)
async def student_stats(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count_r = await db.execute(select(func.count()).select_from(Result).where(Result.user_id == current_user.id))
    tests_completed = count_r.scalar() or 0

    avg_r = await db.execute(select(func.avg(Result.percent)).where(Result.user_id == current_user.id))
    average_score = round(avg_r.scalar() or 0, 1)

    active_r = await db.execute(select(func.count()).select_from(TestSession).where(
        TestSession.user_id == current_user.id, TestSession.status == "in_progress"
    ))
    active_tests = active_r.scalar() or 0

    from app.models.badge import Badge
    badges_r = await db.execute(select(func.count()).select_from(Badge).where(Badge.user_id == current_user.id))
    badges_count = badges_r.scalar() or 0

    return StudentStats(
        tests_completed=tests_completed,
        average_score=average_score,
        active_tests=active_tests,
        streak_days=current_user.streak_days,
        badges_count=badges_count,
    )


@router.get("/teacher", response_model=TeacherStats)
async def teacher_stats(current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    tests_r = await db.execute(select(func.count()).select_from(Test).where(Test.author_id == current_user.id))
    total_tests = tests_r.scalar() or 0

    groups_r = await db.execute(select(func.count()).select_from(Group).where(Group.teacher_id == current_user.id))
    total_groups = groups_r.scalar() or 0

    group_ids_r = await db.execute(select(Group.id).where(Group.teacher_id == current_user.id))
    gids = [r[0] for r in group_ids_r.all()]
    students_r = await db.execute(
        select(func.count(func.distinct(GroupMember.user_id))).where(GroupMember.group_id.in_(gids))
    )
    total_students = students_r.scalar() or 0

    test_ids_r = await db.execute(select(Test.id).where(Test.author_id == current_user.id))
    tids = [r[0] for r in test_ids_r.all()]
    from datetime import datetime, timezone, timedelta
    recent_r = await db.execute(
        select(func.count()).select_from(Result).where(
            Result.test_id.in_(tids),
            Result.completed_at >= datetime.now(timezone.utc) - timedelta(days=7)
        )
    )
    recent_submissions = recent_r.scalar() or 0

    return TeacherStats(
        total_tests=total_tests,
        total_students=total_students,
        total_groups=total_groups,
        recent_submissions=recent_submissions,
    )


@router.get("/admin", response_model=AdminStats)
async def admin_stats(current_user: AdminUser, db: AsyncSession = Depends(get_db)):
    users_r = await db.execute(select(func.count()).select_from(User))
    tests_r = await db.execute(select(func.count()).select_from(Test))
    groups_r = await db.execute(select(func.count()).select_from(Group))
    active_r = await db.execute(select(func.count()).select_from(TestSession).where(TestSession.status == "in_progress"))
    return AdminStats(
        total_users=users_r.scalar() or 0,
        total_tests=tests_r.scalar() or 0,
        total_groups=groups_r.scalar() or 0,
        active_sessions=active_r.scalar() or 0,
    )
