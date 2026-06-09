from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Literal


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: Literal["student", "teacher"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    language: str
    dark_mode: bool
    streak_days: int
    email_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    dark_mode: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    """Body for /auth/google. `credential` is the JWT id_token issued by Google
    Identity Services on the client. `role` is only honored when a new user is
    being created on first sign-in.
    """
    credential: str
    role: Literal["student", "teacher"] = "student"


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerifyRequest(BaseModel):
    email: EmailStr
