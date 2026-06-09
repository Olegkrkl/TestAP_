import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"
    # Comments are loaded per test, newest first.
    __table_args__ = (
        Index("ix_comments_test_id", "test_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    test_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tests.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="comments")
    test = relationship("Test", back_populates="comments")
