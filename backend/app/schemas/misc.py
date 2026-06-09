from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BadgeOut(BaseModel):
    id: str
    user_id: str
    badge_type: str
    earned_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: str
    user_id: str
    test_id: str
    content: str
    user_name: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class AnnouncementCreate(BaseModel):
    content: str
    group_id: str


class AnnouncementOut(BaseModel):
    id: str
    group_id: str
    author_id: str
    content: str
    author_name: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentStats(BaseModel):
    tests_completed: int
    average_score: float
    active_tests: int
    streak_days: int
    badges_count: int


class TeacherStats(BaseModel):
    total_tests: int
    total_students: int
    total_groups: int
    recent_submissions: int


class AdminStats(BaseModel):
    total_users: int
    total_tests: int
    total_groups: int
    active_sessions: int
