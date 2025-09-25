"""Remove Operations and AWX tables

Revision ID: remove_ops_awx
Revises: h1a2b3c4d5e6_add_discovery_depth_and_scanner_ids_to_scan_tasks
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_ops_awx'
down_revision = 'ldap_ip_range_integration'
branch_labels = None
depends_on = None


def upgrade():
    # Drop foreign key constraint from notifications table first
    try:
        op.drop_constraint('notifications_job_id_fkey', 'notifications', type_='foreignkey')
    except:
        pass
    
    # Drop tables (constraints will be dropped automatically)
    op.drop_table('jobs')
    op.drop_table('operations')
    
    # Remove AWX-related columns from settings table (if they exist)
    try:
        op.drop_column('settings', 'awx_url')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_username')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_password')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_token')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_network_discovery_template')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_network_discovery_vars')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_device_config_template')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_device_config_vars')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_security_template')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_security_vars')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_auto_config')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_auto_security')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_sync_inventory')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_inventory_id')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_sync_interval')
    except:
        pass
    try:
        op.drop_column('settings', 'awx_connected')
    except:
        pass


def downgrade():
    # Recreate AWX columns in settings table
    op.add_column('settings', sa.Column('awx_connected', sa.Boolean(), nullable=True, default=False))
    op.add_column('settings', sa.Column('awx_sync_interval', sa.Integer(), nullable=True, default=30))
    op.add_column('settings', sa.Column('awx_inventory_id', sa.String(50), nullable=True))
    op.add_column('settings', sa.Column('awx_sync_inventory', sa.Boolean(), nullable=True, default=False))
    op.add_column('settings', sa.Column('awx_auto_security', sa.Boolean(), nullable=True, default=False))
    op.add_column('settings', sa.Column('awx_auto_config', sa.Boolean(), nullable=True, default=False))
    op.add_column('settings', sa.Column('awx_security_vars', sa.Text(), nullable=True))
    op.add_column('settings', sa.Column('awx_security_template', sa.String(50), nullable=True))
    op.add_column('settings', sa.Column('awx_device_config_vars', sa.Text(), nullable=True))
    op.add_column('settings', sa.Column('awx_device_config_template', sa.String(50), nullable=True))
    op.add_column('settings', sa.Column('awx_network_discovery_vars', sa.Text(), nullable=True))
    op.add_column('settings', sa.Column('awx_network_discovery_template', sa.String(50), nullable=True))
    op.add_column('settings', sa.Column('awx_token', sa.String(500), nullable=True))
    op.add_column('settings', sa.Column('awx_password', sa.String(255), nullable=True))
    op.add_column('settings', sa.Column('awx_username', sa.String(100), nullable=True))
    op.add_column('settings', sa.Column('awx_url', sa.String(500), nullable=True))
    
    # Recreate operations table
    op.create_table('operations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('operation_type', sa.String(50), nullable=False),
        sa.Column('awx_playbook_id', sa.String(50), nullable=True),
        sa.Column('awx_playbook_name', sa.String(255), nullable=True),
        sa.Column('awx_extra_vars', sa.JSON(), nullable=True),
        sa.Column('awx_url', sa.String(500), nullable=True),
        sa.Column('api_url', sa.String(500), nullable=True),
        sa.Column('api_method', sa.String(10), nullable=True),
        sa.Column('api_headers', sa.JSON(), nullable=True),
        sa.Column('api_body', sa.JSON(), nullable=True),
        sa.Column('script_path', sa.String(500), nullable=True),
        sa.Column('script_args', sa.JSON(), nullable=True),
        sa.Column('target_group_id', sa.Integer(), nullable=True),
        sa.Column('target_labels', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_operations_id'), 'operations', ['id'], unique=False)
    op.create_index(op.f('ix_operations_name'), 'operations', ['name'], unique=False)
    
    # Recreate jobs table
    op.create_table('jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('operation_id', sa.Integer(), nullable=False),
        sa.Column('asset_ids', sa.JSON(), nullable=True),
        sa.Column('asset_group_ids', sa.JSON(), nullable=True),
        sa.Column('target_labels', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=True),
        sa.Column('current_asset', sa.String(255), nullable=True),
        sa.Column('results', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('log_output', sa.Text(), nullable=True),
        sa.Column('awx_job_id', sa.String(50), nullable=True),
        sa.Column('awx_job_url', sa.String(500), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('params', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['operation_id'], ['operations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    op.create_index(op.f('ix_jobs_status'), 'jobs', ['status'], unique=False)
