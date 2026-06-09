"""Badge awarding logic."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.badge import Badge
from app.models.result import Result


BADGE_DEFINITIONS = {
    "first_test": "Перший тест",
    "perfect_score": "Відмінник",
    "streak_7": "Тиждень поспіль",
    "streak_30": "Місяць поспіль",
    "tests_10": "10 тестів",
    "tests_50": "50 тестів",
    "fast_finisher": "Блискавка",
}


async def check_and_award_badges(db: AsyncSession, user_id: str, result_percent: float, streak: int):
    existing = await db.execute(select(Badge.badge_type).where(Badge.user_id == user_id))
    existing_types = {row[0] for row in existing.all()}

    total_results = await db.execute(
        select(func.count()).select_from(Result).where(Result.user_id == user_id)
    )
    count = total_results.scalar()

    new_badges = []

    if "first_test" not in existing_types and count >= 1:
        new_badges.append("first_test")
    if "perfect_score" not in existing_types and result_percent == 100:
        new_badges.append("perfect_score")
    if "tests_10" not in existing_types and count >= 10:
        new_badges.append("tests_10")
    if "tests_50" not in existing_types and count >= 50:
        new_badges.append("tests_50")
    if "streak_7" not in existing_types and streak >= 7:
        new_badges.append("streak_7")
    if "streak_30" not in existing_types and streak >= 30:
        new_badges.append("streak_30")

    for badge_type in new_badges:
        db.add(Badge(user_id=user_id, badge_type=badge_type))

    return new_badges
