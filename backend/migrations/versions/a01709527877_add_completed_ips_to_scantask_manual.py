"""Add completed_ips to ScanTask (manual)

Revision ID: a01709527877
Revises: b85c6f21606b
Create Date: 2025-09-13 22:22:04.877388

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a01709527877'
down_revision = 'b85c6f21606b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('scan_tasks', sa.Column('completed_ips', sa.Integer(), nullable=True, server_default='0'))


def downgrade():
    op.drop_column('scan_tasks', 'completed_ips')
