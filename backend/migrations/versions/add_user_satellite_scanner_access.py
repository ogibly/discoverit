"""Add UserSatelliteScannerAccess model for satellite scanner access control

Revision ID: add_user_satellite_scanner_access
Revises: add_user_subnet_access
Create Date: 2024-01-15 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_satellite_scanner_access'
down_revision = 'add_user_subnet_access'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_satellite_scanner_access table
    op.create_table('user_satellite_scanner_access',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('scanner_id', sa.Integer(), nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=True),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['scanner_id'], ['scanner_configs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'scanner_id')
    )


def downgrade():
    # Drop user_satellite_scanner_access table
    op.drop_table('user_satellite_scanner_access')
