import uuid
from datetime import datetime, timezone
from sqlalchemy import Integer, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        # Student history/stats filter by user_id; best-score lookups filter by
        # (user_id, test_id). The composite covers both via its leading column.
        Index("ix_results_user_test", "user_id", "test_id"),
        # Teacher per-test analytics filter by test_id alone.
        Index("ix_results_test_id", "test_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("test_sessions.id", ondelete="CASCADE"), unique=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    test_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tests.id", ondelete="CASCADE"))
    score: Mapped[int] = mapped_column(Integer, default=0)
    max_score: Mapped[int] = mapped_column(Integer, default=0)
    percent: Mapped[float] = mapped_column(Float, default=0.0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    per_question_stats: Mapped[list] = mapped_column(JSONB, default=list)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("TestSession", back_populates="result")
    user = relationship("User")
    test = relationship("Test")
