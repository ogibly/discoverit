"""add_discovery_depth_and_scanner_ids_to_scan_tasks

Revision ID: h1a2b3c4d5e6
Revises: g2b3c4d5e6f7
Create Date: 2025-09-23 01:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h1a2b3c4d5e6'
down_revision = 'g2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    # Add discovery_depth column to scan_tasks table
    op.add_column('scan_tasks', sa.Column('discovery_depth', sa.Integer(), nullable=True, default=1))
    
    # Add scanner_ids column to scan_tasks table
    op.add_column('scan_tasks', sa.Column('scanner_ids', sa.JSON(), nullable=True))
    
    # Update existing records to have default discovery_depth
    op.execute("UPDATE scan_tasks SET discovery_depth = 1 WHERE discovery_depth IS NULL")


def downgrade():
    # Remove the added columns
    op.drop_column('scan_tasks', 'scanner_ids')
    op.drop_column('scan_tasks', 'discovery_depth')
