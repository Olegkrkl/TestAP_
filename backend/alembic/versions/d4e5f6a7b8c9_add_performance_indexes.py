"""add performance indexes on foreign keys and common filters

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-03 13:45:00.000000

Adds indexes covering the hot query paths: session attempt/resume lookups,
the per-minute auto-submit scan, student history and teacher analytics,
question ordering, test catalog filters, deadline scans, notifications,
comments, badges and group membership.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_test_sessions_user_test', 'test_sessions', ['user_id', 'test_id'])
    op.create_index(
        'ix_test_sessions_status', 'test_sessions', ['status'],
        postgresql_where=sa.text("status = 'in_progress'"),
    )

    op.create_index('ix_results_user_test', 'results', ['user_id', 'test_id'])
    op.create_index('ix_results_test_id', 'results', ['test_id'])

    op.create_index('ix_questions_test_order', 'questions', ['test_id', 'order_index'])

    op.create_index('ix_tests_author_id', 'tests', ['author_id'])
    op.create_index('ix_tests_group_id', 'tests', ['group_id'])
    op.create_index('ix_tests_status', 'tests', ['status'])
    op.create_index(
        'ix_tests_closes_at', 'tests', ['closes_at'],
        postgresql_where=sa.text('closes_at IS NOT NULL'),
    )

    op.create_index('ix_notifications_user_read', 'notifications', ['user_id', 'read'])
    op.create_index('ix_comments_test_id', 'comments', ['test_id'])
    op.create_index('ix_badges_user_id', 'badges', ['user_id'])
    op.create_index('ix_group_members_user_id', 'group_members', ['user_id'])
    op.create_index('ix_announcements_group_id', 'announcements', ['group_id'])


def downgrade() -> None:
    op.drop_index('ix_announcements_group_id', table_name='announcements')
    op.drop_index('ix_group_members_user_id', table_name='group_members')
    op.drop_index('ix_badges_user_id', table_name='badges')
    op.drop_index('ix_comments_test_id', table_name='comments')
    op.drop_index('ix_notifications_user_read', table_name='notifications')

    op.drop_index('ix_tests_closes_at', table_name='tests')
    op.drop_index('ix_tests_status', table_name='tests')
    op.drop_index('ix_tests_group_id', table_name='tests')
    op.drop_index('ix_tests_author_id', table_name='tests')

    op.drop_index('ix_questions_test_order', table_name='questions')

    op.drop_index('ix_results_test_id', table_name='results')
    op.drop_index('ix_results_user_test', table_name='results')

    op.drop_index('ix_test_sessions_status', table_name='test_sessions')
    op.drop_index('ix_test_sessions_user_test', table_name='test_sessions')
