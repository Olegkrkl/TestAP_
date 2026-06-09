"""add last_action_at to test_sessions for idle auto-submit

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-21 17:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'test_sessions',
        sa.Column(
            'last_action_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    # Backfill: any pre-existing rows get started_at as their initial last_action_at.
    op.execute("UPDATE test_sessions SET last_action_at = started_at WHERE last_action_at IS NULL OR last_action_at < started_at")


def downgrade() -> None:
    op.drop_column('test_sessions', 'last_action_at')
