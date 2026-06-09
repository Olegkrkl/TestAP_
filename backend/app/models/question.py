import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class Question(Base):
    __tablename__ = "questions"
    # Questions are almost always loaded for one test, ordered by order_index.
    __table_args__ = (
        Index("ix_questions_test_order", "test_id", "order_index"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tests.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=1)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    time_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    options: Mapped[dict] = mapped_column(JSONB, default=dict)

    test = relationship("Test", back_populates="questions")
