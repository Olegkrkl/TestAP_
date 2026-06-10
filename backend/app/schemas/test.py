from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class QuestionCreate(BaseModel):
    type: str
    content: str
    hint: Optional[str] = None
    explanation: Optional[str] = None
    points: int = 1
    order_index: int = 0
    time_limit: Optional[int] = None
    options: dict = {}


class QuestionUpdate(QuestionCreate):
    pass


class QuestionOut(BaseModel):
    id: str
    test_id: str
    type: str
    content: str
    hint: Optional[str] = None
    explanation: Optional[str] = None
    points: int
    order_index: int
    time_limit: Optional[int] = None
    options: dict

    model_config = {"from_attributes": True}


class QuestionOutStudent(BaseModel):
    """Question without correct answers for students during test."""
    id: str
    type: str
    content: str
    hint: Optional[str] = None
    points: int
    order_index: int
    time_limit: Optional[int] = None
    options: dict

    model_config = {"from_attributes": True}


class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    group_id: Optional[str] = None
    time_limit: Optional[int] = None
    per_question_timer: bool = False
    attempts_allowed: int = 1
    shuffle_questions: bool = False
    shuffle_answers: bool = False
    show_answers_after: bool = True
    passing_score: int = 60
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    copy_protection: bool = False
    tab_switch_detection: bool = False
    is_training: bool = False
    partial_scoring: bool = False
    tags: List[str] = []
    category: Optional[str] = None
    status: Optional[str] = None


class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    group_id: Optional[str] = None
    time_limit: Optional[int] = None
    per_question_timer: Optional[bool] = None
    attempts_allowed: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    shuffle_answers: Optional[bool] = None
    show_answers_after: Optional[bool] = None
    passing_score: Optional[int] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    copy_protection: Optional[bool] = None
    tab_switch_detection: Optional[bool] = None
    status: Optional[str] = None
    partial_scoring: Optional[bool] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None


class TestOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    author_id: str
    group_id: Optional[str] = None
    time_limit: Optional[int] = None
    per_question_timer: bool
    attempts_allowed: int
    shuffle_questions: bool
    shuffle_answers: bool
    show_answers_after: bool
    passing_score: int
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    copy_protection: bool
    tab_switch_detection: bool
    status: str
    is_training: bool
    partial_scoring: bool = False
    tags: List[str]
    category: Optional[str] = None
    question_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TestDetail(TestOut):
    questions: List[QuestionOut] = []
