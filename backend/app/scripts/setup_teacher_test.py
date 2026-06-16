"""Create teacher, group, test from DOCX, and assign student access.

Usage:
    python -m app.scripts.setup_teacher_test ^
        --docx "C:\\path\\to\\test.docx" ^
        --teacher-email teacher@testap.app ^
        --teacher-password "Teacher1234!" ^
        --student-email student@testap.app
"""
from __future__ import annotations

import argparse
import asyncio
import secrets
import string
from pathlib import Path

from sqlalchemy import delete, select

from app.api.import_export import _normalize_questions, _parse_file
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.group import Group, GroupMember
from app.models.question import Question
from app.models.test import Test
from app.models.user import User


def _invite_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


async def run(
    docx_path: Path,
    teacher_email: str,
    teacher_password: str,
    teacher_name: str,
    student_email: str,
    test_title: str,
) -> None:
    content = docx_path.read_bytes()
    raw = _parse_file(docx_path.name, content)
    questions_data = _normalize_questions(raw)
    if not questions_data:
        raise SystemExit(f"No questions parsed from {docx_path}")

    async with AsyncSessionLocal() as db:
        teacher_r = await db.execute(select(User).where(User.email == teacher_email))
        teacher = teacher_r.scalar_one_or_none()
        if teacher:
            teacher.role = "teacher"
            teacher.is_active = True
            teacher.password_hash = hash_password(teacher_password)
            teacher.full_name = teacher_name
            print(f"Updated teacher: {teacher_email}")
        else:
            teacher = User(
                email=teacher_email,
                password_hash=hash_password(teacher_password),
                full_name=teacher_name,
                role="teacher",
                is_active=True,
            )
            db.add(teacher)
            await db.flush()
            print(f"Created teacher: {teacher_email}")

        student_r = await db.execute(select(User).where(User.email == student_email))
        student = student_r.scalar_one_or_none()
        if not student:
            raise SystemExit(f"Student not found: {student_email}")

        group_r = await db.execute(
            select(Group).where(Group.teacher_id == teacher.id, Group.name == "Група TestAP")
        )
        group = group_r.scalar_one_or_none()
        if not group:
            group = Group(
                name="Група TestAP",
                description="Група для демо-тестів захисту",
                teacher_id=teacher.id,
                invite_code=_invite_code(),
            )
            db.add(group)
            await db.flush()
            print(f"Created group: {group.name} (invite {group.invite_code})")
        else:
            print(f"Using existing group: {group.name}")

        member_r = await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group.id,
                GroupMember.user_id == student.id,
            )
        )
        if not member_r.scalar_one_or_none():
            db.add(GroupMember(group_id=group.id, user_id=student.id))
            print(f"Added student {student_email} to group")

        test_r = await db.execute(
            select(Test).where(
                Test.author_id == teacher.id,
                Test.title == test_title,
                Test.group_id == group.id,
            )
        )
        test = test_r.scalar_one_or_none()
        if test:
            await db.execute(delete(Question).where(Question.test_id == test.id))
            test.status = "published"
            test.group_id = group.id
            test.time_limit = 10
            print(f"Replacing questions in existing test: {test_title}")
        else:
            test = Test(
                title=test_title,
                description="Імпортовано з DOCX для демонстрації",
                author_id=teacher.id,
                group_id=group.id,
                status="published",
                is_training=False,
                attempts_allowed=3,
                time_limit=10,
                show_answers_after=True,
            )
            db.add(test)
            await db.flush()
            print(f"Created test: {test_title} (id={test.id})")

        for idx, q in enumerate(questions_data):
            db.add(
                Question(
                    test_id=test.id,
                    type=q.get("type", "single-choice"),
                    content=q.get("content", ""),
                    hint=q.get("hint"),
                    explanation=q.get("explanation"),
                    points=q.get("points", 1),
                    order_index=idx,
                    options=q.get("options") or {},
                )
            )

        await db.commit()
        print(f"Imported {len(questions_data)} questions")
        print(f"Teacher login: {teacher_email} / {teacher_password}")
        print(f"Student login: {student_email} — test visible under Тести")


def main() -> None:
    parser = argparse.ArgumentParser(description="Setup teacher test from DOCX")
    parser.add_argument("--docx", required=True, help="Path to .docx file")
    parser.add_argument("--teacher-email", default="teacher@testap.app")
    parser.add_argument("--teacher-password", default="Teacher1234!")
    parser.add_argument("--teacher-name", default="Demo Teacher")
    parser.add_argument("--student-email", default="student@testap.app")
    parser.add_argument("--test-title", default="ТЕСТ (DOCX)")
    args = parser.parse_args()

    asyncio.run(
        run(
            Path(args.docx),
            args.teacher_email.strip().lower(),
            args.teacher_password,
            args.teacher_name,
            args.student_email.strip().lower(),
            args.test_title,
        )
    )


if __name__ == "__main__":
    main()
