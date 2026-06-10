from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    # Optional comma-separated extra origins (e.g. Vercel preview URLs).
    CORS_ORIGINS: str = ""
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "TestAP <noreply@testap.app>"
    # Google OAuth (Google Identity Services). Leave empty to disable Google login.
    GOOGLE_CLIENT_ID: str = ""
    # Email verification + login throttling
    REQUIRE_EMAIL_VERIFICATION: bool = False
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 10
    # Auto-finalize an in-progress session after this many minutes of inactivity
    # even when the test has no time_limit. Prevents zombie sessions when the
    # student closes the browser without submitting.
    SESSION_IDLE_TIMEOUT_MINUTES: int = 360

    class Config:
        env_file = ".env"


settings = Settings()


def get_cors_origins() -> list[str]:
    origins: list[str] = []
    if settings.FRONTEND_URL:
        origins.append(settings.FRONTEND_URL.rstrip("/"))
    if settings.CORS_ORIGINS:
        origins.extend(
            o.strip().rstrip("/")
            for o in settings.CORS_ORIGINS.split(",")
            if o.strip()
        )
    return origins or ["*"]
