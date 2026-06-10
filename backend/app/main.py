from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings, get_cors_origins
from app.core.database import AsyncSessionLocal
from app.core.rate_limit import limiter
from app.services.session_service import auto_submit_expired_sessions
from app.api import auth, users, groups, tests, sessions, results, notifications, import_export, stats, comments

scheduler = AsyncIOScheduler()


async def auto_submit_job():
    async with AsyncSessionLocal() as db:
        try:
            count = await auto_submit_expired_sessions(db)
            await db.commit()
            if count:
                print(f"Auto-submitted {count} expired sessions")
        except Exception as e:
            print(f"Auto-submit error: {e}")


async def deadline_reminder_job():
    """Runs every 24 hours. Sends email reminders for tests closing in ~24h."""
    from sqlalchemy import select
    from app.models.test import Test
    from app.models.group import GroupMember
    from app.models.user import User
    from app.services.email_service import send_deadline_reminder

    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now(timezone.utc)
            window_start = now + timedelta(hours=23)
            window_end = now + timedelta(hours=25)

            result = await db.execute(
                select(Test).where(
                    Test.closes_at >= window_start,
                    Test.closes_at <= window_end,
                    Test.status == "published",
                    Test.group_id.isnot(None),
                )
            )
            tests_due = result.scalars().all()

            sent = 0
            for test in tests_due:
                members_r = await db.execute(
                    select(GroupMember).where(GroupMember.group_id == test.group_id)
                )
                members = members_r.scalars().all()

                for member in members:
                    user_r = await db.execute(select(User).where(User.id == member.user_id))
                    user = user_r.scalar_one_or_none()
                    if user and user.is_active:
                        closes_str = test.closes_at.strftime("%d.%m.%Y %H:%M") if test.closes_at else ""
                        ok = await send_deadline_reminder(
                            to_email=user.email,
                            user_name=user.full_name,
                            test_title=test.title,
                            closes_at=closes_str,
                        )
                        if ok:
                            sent += 1

            if sent:
                print(f"Deadline reminders sent: {sent}")
        except Exception as e:
            print(f"Deadline reminder error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(auto_submit_job, "interval", seconds=60)
    scheduler.add_job(deadline_reminder_job, "interval", hours=24)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="TestAP API",
    version="1.0.0",
    description="Intelligent Testing Platform API",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    # Allow all Vercel preview/production URLs (e.g. test-ap-xi.vercel.app).
    allow_origin_regex=r"https://([a-z0-9-]+\.)*vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(groups.router, prefix=PREFIX)
app.include_router(tests.router, prefix=PREFIX)
app.include_router(sessions.router, prefix=PREFIX)
app.include_router(results.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(import_export.router, prefix=PREFIX)
app.include_router(stats.router, prefix=PREFIX)
app.include_router(comments.router, prefix=PREFIX)


@app.get("/")
async def root():
    return {"message": "TestAP API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
