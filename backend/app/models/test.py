import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Text, ARRAY, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Test(Base):
    __tablename__ = "tests"
    __table_args__ = (
        # Teacher's "my tests" listing.
        Index("ix_tests_author_id", "author_id"),
        # Group-scoped test listings and the deadline-reminder job.
        Index("ix_tests_group_id", "group_id"),
        # Catalog filtering by publication status.
        Index("ix_tests_status", "status"),
        # Calendar/deadline-reminder scans only tests that have a close date.
        Index(
            "ix_tests_closes_at",
            "closes_at",
            postgresql_where=text("closes_at IS NOT NULL"),
        ),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    group_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    time_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    per_question_timer: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts_allowed: Mapped[int] = mapped_column(Integer, default=1)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, default=False)
    shuffle_answers: Mapped[bool] = mapped_column(Boolean, default=False)
    show_answers_after: Mapped[bool] = mapped_column(Boolean, default=True)
    passing_score: Mapped[int] = mapped_column(Integer, default=60)
    opens_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closes_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    copy_protection: Mapped[bool] = mapped_column(Boolean, default=False)
    tab_switch_detection: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    is_training: Mapped[bool] = mapped_column(Boolean, default=False)
    partial_scoring: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list] = mapped_column(ARRAY(String), default=list)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", foreign_keys=[author_id])
    group = relationship("Group", back_populates="tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan", order_by="Question.order_index")
    sessions = relationship("TestSession", back_populates="test", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="test", cascade="all, delete-orphan")
