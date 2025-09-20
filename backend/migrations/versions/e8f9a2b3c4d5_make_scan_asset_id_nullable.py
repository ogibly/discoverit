"""make scan asset_id nullable

Revision ID: e8f9a2b3c4d5
Revises: d1e8f9a2b3c4
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8f9a2b3c4d5'
down_revision = 'd1e8f9a2b3c4'
branch_labels = None
depends_on = None


def upgrade():
    # Make asset_id nullable in scans table
    op.alter_column('scans', 'asset_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)


def downgrade():
    # Make asset_id non-nullable again
    op.alter_column('scans', 'asset_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

