"""add partial_scoring to tests

Revision ID: a1b2c3d4e5f6
Revises: cd28c282a44b
Create Date: 2026-04-27 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'cd28c282a44b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tests', sa.Column('partial_scoring', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('tests', 'partial_scoring')
