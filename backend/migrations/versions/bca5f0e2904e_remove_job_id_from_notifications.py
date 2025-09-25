"""remove_job_id_from_notifications

Revision ID: bca5f0e2904e
Revises: remove_ops_awx
Create Date: 2025-09-25 09:15:32.265889

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bca5f0e2904e'
down_revision = 'remove_ops_awx'
branch_labels = None
depends_on = None


def upgrade():
    # Remove job_id column from notifications table
    op.drop_column('notifications', 'job_id')


def downgrade():
    # Re-add job_id column to notifications table
    op.add_column('notifications', sa.Column('job_id', sa.Integer(), nullable=True))
