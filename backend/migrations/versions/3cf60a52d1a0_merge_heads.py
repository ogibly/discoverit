"""merge_heads

Revision ID: 3cf60a52d1a0
Revises: add_user_satellite_scanner_access, fix_scan_templates_schema, refactor_scan_tasks_templates
Create Date: 2025-10-04 08:08:46.271030

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3cf60a52d1a0'
down_revision = ('add_user_satellite_scanner_access', 'fix_scan_templates_schema', 'refactor_scan_tasks_templates')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
