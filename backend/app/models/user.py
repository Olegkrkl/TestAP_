import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    # Nullable so Google-only accounts (no password set) are valid.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    language: Mapped[str] = mapped_column(String(5), default="uk")
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    streak_days: Mapped[int] = mapped_column(default=0)
    last_activity: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Google OAuth identity. NULL for users who registered with email/password only.
    google_sub: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    # Email verification (sent via Resend after registration).
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verify_token: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email_verify_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    group_memberships = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("TestSession", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
