from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.user import UserOut


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GroupMemberOut(BaseModel):
    id: str
    user: UserOut
    joined_at: datetime

    model_config = {"from_attributes": True}


class GroupOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    teacher_id: str
    invite_code: Optional[str] = None
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class GroupDetail(GroupOut):
    members: List[GroupMemberOut] = []


class JoinGroupRequest(BaseModel):
    invite_code: str
