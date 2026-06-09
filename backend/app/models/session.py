import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class TestSession(Base):
    __tablename__ = "test_sessions"
    __table_args__ = (
        # Attempt counting and "resume in-progress session" lookups filter by
        # (user_id, test_id); the composite also serves user_id-only queries.
        Index("ix_test_sessions_user_test", "user_id", "test_id"),
        # The auto-submit job scans only in-progress rows once a minute.
        Index(
            "ix_test_sessions_status",
            "status",
            postgresql_where=text("status = 'in_progress'"),
        ),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    test_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tests.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # Bumped on every interaction (save answer, flag, ping). Used by the idle
    # auto-submit job to clean up sessions abandoned by the user.
    last_action_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    answers: Mapped[dict] = mapped_column(JSONB, default=dict)
    flagged: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    violations: Mapped[int] = mapped_column(Integer, default=0)
    hint_used: Mapped[list] = mapped_column(JSONB, default=list)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="sessions")
    test = relationship("Test", back_populates="sessions")
    result = relationship("Result", back_populates="session", uselist=False)
