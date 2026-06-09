from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List


class SessionStart(BaseModel):
    test_id: str


class AnswerSave(BaseModel):
    question_id: str
    answer: Any


class FlagQuestion(BaseModel):
    question_id: str


class SessionOut(BaseModel):
    id: str
    test_id: str
    user_id: str
    started_at: datetime
    answers: dict
    flagged: list
    status: str
    violations: int
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TimeRemaining(BaseModel):
    remaining_seconds: Optional[int]
    total_seconds: Optional[int]


class ViolationReport(BaseModel):
    type: str


class QuestionStatOut(BaseModel):
    question_id: str
    correct: bool
    points_earned: int
    points_possible: int
    time_spent: Optional[int] = None
    user_answer: Any
    correct_answer: Any
    question_content: str
    question_type: str
    hint_used: bool = False
    explanation: Optional[str] = None


class ResultOut(BaseModel):
    id: str
    session_id: str
    user_id: str
    test_id: str
    score: int
    max_score: int
    percent: float
    passed: bool
    per_question_stats: List[QuestionStatOut]
    completed_at: datetime
    violations: int = 0

    model_config = {"from_attributes": True}
