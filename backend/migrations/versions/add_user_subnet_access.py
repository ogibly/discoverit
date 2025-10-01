"""Add UserSubnetAccess model for subnet access control

Revision ID: add_user_subnet_access
Revises: add_subnet_model
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_subnet_access'
down_revision = 'add_subnet_model'
branch_labels = None
depends_on = None


def upgrade():
    # Create user_subnet_access table
    op.create_table('user_subnet_access',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subnet_id', sa.Integer(), nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=True),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['subnet_id'], ['subnets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'subnet_id')
    )


def downgrade():
    # Drop user_subnet_access table
    op.drop_table('user_subnet_access')
