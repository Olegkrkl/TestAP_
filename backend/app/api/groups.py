import csv
import io
import secrets
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import CurrentUser, TeacherUser, AdminUser
from app.core.security import hash_password
from app.models.group import Group, GroupMember
from app.models.user import User
from app.models.announcement import Announcement
from app.schemas.group import GroupCreate, GroupUpdate, GroupOut, GroupDetail, GroupMemberOut, JoinGroupRequest
from app.schemas.misc import AnnouncementCreate, AnnouncementOut

router = APIRouter(prefix="/groups", tags=["groups"])


def _group_out(group: Group, member_count: int) -> GroupOut:
    return GroupOut(
        id=group.id, name=group.name, description=group.description,
        teacher_id=group.teacher_id, invite_code=group.invite_code,
        created_at=group.created_at, member_count=member_count,
    )


@router.post("/", response_model=GroupOut, status_code=201)
async def create_group(data: GroupCreate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    code = secrets.token_urlsafe(6).upper()
    group = Group(name=data.name, description=data.description, teacher_id=current_user.id, invite_code=code)
    db.add(group)
    await db.flush()
    return _group_out(group, 0)


@router.get("/", response_model=List[GroupOut])
async def list_groups(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(None),
):
    if current_user.role == "student":
        query = (
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == current_user.id)
        )
    elif current_user.role == "teacher":
        query = select(Group).where(Group.teacher_id == current_user.id)
    else:
        query = select(Group)

    if search:
        query = query.where(Group.name.ilike(f"%{search}%"))

    result = await db.execute(query)
    groups = result.scalars().all()
    out = []
    for g in groups:
        cnt = await db.execute(select(func.count()).select_from(GroupMember).where(GroupMember.group_id == g.id))
        out.append(_group_out(g, cnt.scalar() or 0))
    return out


@router.get("/{group_id}", response_model=GroupDetail)
async def get_group(group_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    members_result = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group_id)
    )
    members = members_result.scalars().all()
    member_outs = []
    for m in members:
        user_r = await db.execute(select(User).where(User.id == m.user_id))
        u = user_r.scalar_one_or_none()
        if u:
            from app.schemas.user import UserOut
            member_outs.append(GroupMemberOut(id=m.id, user=UserOut.model_validate(u), joined_at=m.joined_at))

    return GroupDetail(
        id=group.id, name=group.name, description=group.description,
        teacher_id=group.teacher_id, invite_code=group.invite_code,
        created_at=group.created_at, member_count=len(members),
        members=member_outs,
    )


@router.patch("/{group_id}", response_model=GroupOut)
async def update_group(group_id: str, data: GroupUpdate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    cnt = await db.execute(select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group.id))
    return _group_out(group, cnt.scalar() or 0)


@router.delete("/{group_id}", status_code=204)
async def delete_group(group_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(group)


@router.post("/join", response_model=GroupOut)
async def join_group(data: JoinGroupRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).where(Group.invite_code == data.invite_code.upper()))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    existing = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")
    db.add(GroupMember(group_id=group.id, user_id=current_user.id))
    await db.flush()
    cnt = await db.execute(select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group.id))
    return _group_out(group, cnt.scalar() or 0)


@router.post("/{group_id}/import-members")
async def import_members(
    group_id: str,
    current_user: TeacherUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    """Bulk-add students to a group via CSV.

    Accepted formats:
      - 1 column: email
      - 2 columns: email, full_name

    For unknown emails a placeholder student account is created with a random
    password (user can later request a password reset). Returns counts of
    added/created/skipped rows plus per-row errors.
    """
    group_r = await db.execute(select(Group).where(Group.id == group_id))
    group = group_r.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("cp1251", errors="ignore")

    # Auto-detect delimiter (comma or semicolon — common in Excel locale).
    sample = text.splitlines()[0] if text else ""
    delimiter = ";" if sample.count(";") > sample.count(",") else ","
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)

    added = 0
    created = 0
    skipped = 0
    errors: list[dict] = []

    for row_idx, row in enumerate(reader, start=1):
        if not row or not row[0].strip():
            continue
        email = row[0].strip().lower()
        # Skip a header row that looks like "email" or "e-mail".
        if row_idx == 1 and email.replace("-", "").replace("_", "") in {"email", "e mail", "e-mail"}:
            continue
        if "@" not in email:
            skipped += 1
            errors.append({"row": row_idx, "email": email, "error": "Invalid email"})
            continue
        full_name = row[1].strip() if len(row) > 1 and row[1].strip() else email.split("@")[0]

        user_r = await db.execute(select(User).where(User.email == email))
        user = user_r.scalar_one_or_none()
        if not user:
            random_pw = secrets.token_urlsafe(12)
            user = User(
                email=email,
                password_hash=hash_password(random_pw),
                full_name=full_name,
                role="student",
                email_verified=False,
            )
            db.add(user)
            await db.flush()
            created += 1

        existing = await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user.id,
            )
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        db.add(GroupMember(group_id=group_id, user_id=user.id))
        added += 1

    return {
        "added": added,
        "created_accounts": created,
        "skipped": skipped,
        "errors": errors,
    }


@router.delete("/{group_id}/members/{user_id}", status_code=204)
async def remove_member(group_id: str, user_id: str, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)


@router.post("/{group_id}/announcements", response_model=AnnouncementOut, status_code=201)
async def create_announcement(group_id: str, data: AnnouncementCreate, current_user: TeacherUser, db: AsyncSession = Depends(get_db)):
    ann = Announcement(group_id=group_id, author_id=current_user.id, content=data.content)
    db.add(ann)
    await db.flush()
    return AnnouncementOut(
        id=ann.id, group_id=ann.group_id, author_id=ann.author_id,
        content=ann.content, author_name=current_user.full_name, created_at=ann.created_at,
    )


@router.get("/{group_id}/announcements", response_model=List[AnnouncementOut])
async def list_announcements(group_id: str, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Announcement).where(Announcement.group_id == group_id).order_by(Announcement.created_at.desc())
    )
    anns = result.scalars().all()
    out = []
    for a in anns:
        ur = await db.execute(select(User).where(User.id == a.author_id))
        u = ur.scalar_one_or_none()
        out.append(AnnouncementOut(
            id=a.id, group_id=a.group_id, author_id=a.author_id,
            content=a.content, author_name=u.full_name if u else "", created_at=a.created_at,
        ))
    return out
