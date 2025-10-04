"""Add Subnet model and update ScanTask with subnet relationship

Revision ID: add_subnet_model
Revises: h1a2b3c4d5e6_add_discovery_depth_and_scanner_ids_to_scan_tasks
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subnet_model'
down_revision = 'h1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Create subnets table
    op.create_table('subnets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cidr', sa.String(length=18), nullable=False),
        sa.Column('network_address', sa.String(length=15), nullable=False),
        sa.Column('subnet_mask', sa.String(length=15), nullable=False),
        sa.Column('gateway', sa.String(length=15), nullable=True),
        sa.Column('vlan_id', sa.Integer(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('department', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_managed', sa.Boolean(), nullable=True),
        sa.Column('scan_frequency', sa.String(length=20), nullable=True),
        sa.Column('last_scanned', sa.DateTime(), nullable=True),
        sa.Column('next_scan', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subnets_cidr'), 'subnets', ['cidr'], unique=False)
    op.create_index(op.f('ix_subnets_id'), 'subnets', ['id'], unique=False)
    op.create_index(op.f('ix_subnets_is_active'), 'subnets', ['is_active'], unique=False)
    op.create_index(op.f('ix_subnets_name'), 'subnets', ['name'], unique=False)

    # Add subnet_id column to scan_tasks table
    op.add_column('scan_tasks', sa.Column('subnet_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_scan_tasks_subnet_id', 'scan_tasks', 'subnets', ['subnet_id'], ['id'])


def downgrade():
    # Remove foreign key and column from scan_tasks
    op.drop_constraint('fk_scan_tasks_subnet_id', 'scan_tasks', type_='foreignkey')
    op.drop_column('scan_tasks', 'subnet_id')

    # Drop subnets table
    op.drop_index(op.f('ix_subnets_name'), table_name='subnets')
    op.drop_index(op.f('ix_subnets_is_active'), table_name='subnets')
    op.drop_index(op.f('ix_subnets_id'), table_name='subnets')
    op.drop_index(op.f('ix_subnets_cidr'), table_name='subnets')
    op.drop_table('subnets')
