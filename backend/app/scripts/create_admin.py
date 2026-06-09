"""CLI script to create an admin user.

Usage:
    python -m app.scripts.create_admin --email admin@testap.app --password "S3cretPass!" --name "Адмін"

If --password is omitted, the script prompts for it interactively.
"""
import argparse
import asyncio
import getpass
import sys

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User


async def upsert_admin(email: str, password: str, full_name: str) -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email))
        user = existing.scalar_one_or_none()
        if user:
            user.role = "admin"
            user.is_active = True
            user.password_hash = hash_password(password)
            user.full_name = full_name
            await db.commit()
            print(f"Updated existing user to admin: {email}")
            return
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="admin",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        print(f"Created admin: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote an admin user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", default="Administrator")
    parser.add_argument("--password", default=None)
    args = parser.parse_args()

    password = args.password or getpass.getpass("Admin password: ")
    if len(password) < 6:
        print("Password must be at least 6 characters", file=sys.stderr)
        sys.exit(1)

    asyncio.run(upsert_admin(args.email, password, args.name))


if __name__ == "__main__":
    main()
