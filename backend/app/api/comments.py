from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.deps import CurrentUser
from app.models.comment import Comment
from app.models.user import User
from app.schemas.misc import CommentCreate, CommentOut

router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("/tests/{test_id}", response_model=CommentOut, status_code=201)
async def add_comment(test_id: str, data: CommentCreate, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    comment = Comment(user_id=current_user.id, test_id=test_id, content=data.content)
    db.add(comment)
    await db.flush()
    return CommentOut(
        id=comment.id, user_id=comment.user_id, test_id=comment.test_id,
        content=comment.content, user_name=current_user.full_name, created_at=comment.created_at,
    )


@router.get("/tests/{test_id}", response_model=List[CommentOut])
async def get_comments(test_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).where(Comment.test_id == test_id).order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()
    out = []
    for c in comments:
        ur = await db.execute(select(User).where(User.id == c.user_id))
        u = ur.scalar_one_or_none()
        out.append(CommentOut(
            id=c.id, user_id=c.user_id, test_id=c.test_id,
            content=c.content, user_name=u.full_name if u else "", created_at=c.created_at,
        ))
    return out
