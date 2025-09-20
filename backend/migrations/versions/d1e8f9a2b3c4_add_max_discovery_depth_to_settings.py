"""add_max_discovery_depth_to_settings

Revision ID: d1e8f9a2b3c4
Revises: 3a38404c0bb9
Create Date: 2025-09-20 09:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1e8f9a2b3c4'
down_revision = '3a38404c0bb9'
branch_labels = None
depends_on = None


def upgrade():
    # Add max_discovery_depth column to settings table
    op.add_column('settings', sa.Column('max_discovery_depth', sa.Integer(), nullable=True, default=3))


def downgrade():
    # Remove max_discovery_depth column from settings table
    op.drop_column('settings', 'max_discovery_depth')

