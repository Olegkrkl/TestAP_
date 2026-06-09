"""add google_sub, email_verified, email_verify_token to users; make password_hash nullable

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-21 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_sub', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verify_token', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('email_verify_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_users_google_sub', 'users', ['google_sub'], unique=True)
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'password_hash', existing_type=sa.String(length=255), nullable=False)
    op.drop_index('ix_users_google_sub', table_name='users')
    op.drop_column('users', 'email_verify_sent_at')
    op.drop_column('users', 'email_verify_token')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'google_sub')
