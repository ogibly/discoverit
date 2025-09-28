"""Refactor scan tasks to use templates as single source of truth

Revision ID: refactor_scan_tasks_templates
Revises: h1a2b3c4d5e6
Create Date: 2025-09-28 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'refactor_scan_tasks_templates'
down_revision = 'cb1c03a45ec0'
branch_labels = None
depends_on = None


def upgrade():
    """Add scan_template_id and remove scan_type from scan_tasks."""
    # Add scan_template_id column
    op.add_column('scan_tasks', sa.Column('scan_template_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key('fk_scan_tasks_template_id', 'scan_tasks', 'scan_templates', ['scan_template_id'], ['id'])
    
    # Remove scan_type column
    op.drop_column('scan_tasks', 'scan_type')


def downgrade():
    """Revert changes - add scan_type back and remove scan_template_id."""
    # Add scan_type column back
    op.add_column('scan_tasks', sa.Column('scan_type', sa.String(50), nullable=False, server_default='standard'))
    
    # Remove foreign key constraint
    op.drop_constraint('fk_scan_tasks_template_id', 'scan_tasks', type_='foreignkey')
    
    # Remove scan_template_id column
    op.drop_column('scan_tasks', 'scan_template_id')
