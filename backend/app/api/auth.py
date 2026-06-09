import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.user import (
    UserRegister, UserLogin, TokenResponse, UserOut, RefreshRequest,
    ForgotPassword, PasswordChange, GoogleLoginRequest, VerifyEmailRequest, ResendVerifyRequest,
)
from app.core.deps import CurrentUser
from app.services.google_auth import verify_google_id_token
from app.services.email_service import send_email_verification

router = APIRouter(prefix="/auth", tags=["auth"])

# Public registration is limited to these roles. `admin` can only be created via
# the seed script (`python -m app.scripts.create_admin`).
PUBLIC_REGISTRATION_ROLES = {"student", "teacher"}

VERIFY_TOKEN_TTL = timedelta(hours=24)


def _issue_tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


async def _send_verification_email(user: User) -> None:
    """Generate a fresh verification token and email it. Safe no-op if Resend
    isn't configured — we still set the token so /auth/verify-email works."""
    user.email_verify_token = secrets.token_urlsafe(32)
    user.email_verify_sent_at = datetime.now(timezone.utc)
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verify_token}"
    await send_email_verification(user.email, user.full_name, verify_url)


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    role = data.role if data.role in PUBLIC_REGISTRATION_ROLES else "student"
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    await _send_verification_email(user)
    return _issue_tokens(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    if settings.REQUIRE_EMAIL_VERIFICATION and not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    return _issue_tokens(user)


@router.post("/google", response_model=TokenResponse)
@limiter.limit("20/minute")
async def google_login(request: Request, data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    identity = verify_google_id_token(data.credential)
    if not identity:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    # Look up by google_sub first (most stable), then fall back to email.
    result = await db.execute(select(User).where(User.google_sub == identity["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.email == identity["email"]))
        user = result.scalar_one_or_none()

    if user:
        # Link Google to an existing email/password account, and trust Google's
        # email_verified flag — Google has already verified the address.
        if not user.google_sub:
            user.google_sub = identity["sub"]
        if identity["email_verified"]:
            user.email_verified = True
        if not user.avatar_url and identity["picture"]:
            user.avatar_url = identity["picture"]
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")
        return _issue_tokens(user)

    # First-time sign-in — create a new account. Honor requested role (student
    # or teacher); `admin` is never created via this path.
    role = data.role if data.role in PUBLIC_REGISTRATION_ROLES else "student"
    user = User(
        email=identity["email"],
        password_hash=None,
        full_name=identity["name"] or identity["email"],
        role=role,
        google_sub=identity["sub"],
        email_verified=identity["email_verified"],
        avatar_url=identity["picture"],
    )
    db.add(user)
    await db.flush()
    return _issue_tokens(user)


@router.post("/verify-email", response_model=UserOut)
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email_verify_token == data.token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if user.email_verify_sent_at and (
        datetime.now(timezone.utc) - user.email_verify_sent_at > VERIFY_TOKEN_TTL
    ):
        raise HTTPException(status_code=400, detail="Verification link expired")
    user.email_verified = True
    user.email_verify_token = None
    return UserOut.model_validate(user)


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, data: ResendVerifyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    # Always return success-shape for privacy.
    if user and not user.email_verified:
        await _send_verification_email(user)
    return {"message": "If that email is registered and unverified, a link has been sent."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    user_id = decode_token(data.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return _issue_tokens(user)


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalar_one_or_none()
    # Always return 200 for security
    return {"message": "If that email is registered, a reset link has been sent."}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    return UserOut.model_validate(current_user)


@router.post("/change-password")
async def change_password(data: PasswordChange, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if not current_user.password_hash or not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(data.new_password)
    return {"message": "Password changed successfully"}


@router.get("/google/config")
async def google_config():
    """Public endpoint so the frontend can discover whether Google sign-in is
    enabled and which client_id to use without baking it into the bundle."""
    return {"client_id": settings.GOOGLE_CLIENT_ID, "enabled": bool(settings.GOOGLE_CLIENT_ID)}
