from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import CurrentUser, AdminUser
from app.models.user import User
from app.models.result import Result
from app.models.badge import Badge
from app.schemas.user import UserOut, UserUpdate, AdminUserUpdate
from app.schemas.misc import StudentStats, BadgeOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_profile(current_user: CurrentUser):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_profile(data: UserUpdate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    return UserOut.model_validate(current_user)


@router.get("/me/stats", response_model=StudentStats)
async def get_my_stats(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count_result = await db.execute(
        select(func.count()).select_from(Result).where(Result.user_id == current_user.id)
    )
    tests_completed = count_result.scalar() or 0

    avg_result = await db.execute(
        select(func.avg(Result.percent)).where(Result.user_id == current_user.id)
    )
    average_score = round(avg_result.scalar() or 0, 1)

    badges_result = await db.execute(
        select(func.count()).select_from(Badge).where(Badge.user_id == current_user.id)
    )
    badges_count = badges_result.scalar() or 0

    return StudentStats(
        tests_completed=tests_completed,
        average_score=average_score,
        active_tests=0,
        streak_days=current_user.streak_days,
        badges_count=badges_count,
    )


@router.get("/me/badges", response_model=List[BadgeOut])
async def get_my_badges(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Badge).where(Badge.user_id == current_user.id))
    return [BadgeOut.model_validate(b) for b in result.scalars().all()]


# Admin endpoints
@router.get("/", response_model=List[UserOut])
async def list_all_users(
    admin: AdminUser,
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 50,
):
    query = select(User)
    if search:
        query = query.where(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.patch("/{user_id}", response_model=UserOut)
async def admin_update_user(user_id: str, data: AdminUserUpdate, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=204)
async def admin_delete_user(user_id: str, admin: AdminUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
