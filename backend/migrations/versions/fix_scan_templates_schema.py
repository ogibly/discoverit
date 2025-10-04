"""Fix scan_templates schema by removing scan_type column

Revision ID: fix_scan_templates_schema
Revises: enterprise_enhancement_001
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_scan_templates_schema'
down_revision = 'enterprise_enhancement_001'
branch_labels = None
depends_on = None


def upgrade():
    # Remove scan_type column from scan_templates table
    op.drop_column('scan_templates', 'scan_type')


def downgrade():
    # Add scan_type column back
    op.add_column('scan_templates', sa.Column('scan_type', sa.String(length=50), nullable=False, server_default='standard'))
