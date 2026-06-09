import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Announcement(Base):
    __tablename__ = "announcements"
    # Announcements are listed per group.
    __table_args__ = (
        Index("ix_announcements_group_id", "group_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("groups.id", ondelete="CASCADE"))
    author_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    group = relationship("Group", back_populates="announcements")
    author = relationship("User")
