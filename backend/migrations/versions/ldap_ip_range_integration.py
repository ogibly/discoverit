"""Add LDAP integration and IP range management

Revision ID: ldap_ip_range_integration
Revises: h1a2b3c4d5e6
Create Date: 2025-09-23 13:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ldap_ip_range_integration'
down_revision = 'h1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('auth_source', sa.String(20), nullable=False, server_default='local'))
    op.add_column('users', sa.Column('ldap_dn', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('ldap_uid', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('last_ldap_sync', sa.DateTime(), nullable=True))
    
    # Make hashed_password nullable for LDAP users
    op.alter_column('users', 'hashed_password', nullable=True)
    
    # Create LDAP configurations table
    op.create_table('ldap_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('server_uri', sa.String(500), nullable=False),
        sa.Column('use_ssl', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('use_tls', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('verify_cert', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('bind_dn', sa.String(500), nullable=True),
        sa.Column('bind_password', sa.String(500), nullable=True),
        sa.Column('user_base_dn', sa.String(500), nullable=False),
        sa.Column('user_search_filter', sa.String(500), nullable=False, server_default='(objectClass=person)'),
        sa.Column('user_search_scope', sa.String(20), nullable=False, server_default='subtree'),
        sa.Column('username_attribute', sa.String(100), nullable=False, server_default='sAMAccountName'),
        sa.Column('email_attribute', sa.String(100), nullable=False, server_default='mail'),
        sa.Column('full_name_attribute', sa.String(100), nullable=False, server_default='displayName'),
        sa.Column('first_name_attribute', sa.String(100), nullable=False, server_default='givenName'),
        sa.Column('last_name_attribute', sa.String(100), nullable=False, server_default='sn'),
        sa.Column('group_base_dn', sa.String(500), nullable=True),
        sa.Column('group_search_filter', sa.String(500), nullable=False, server_default='(objectClass=group)'),
        sa.Column('group_member_attribute', sa.String(100), nullable=False, server_default='member'),
        sa.Column('user_member_attribute', sa.String(100), nullable=False, server_default='memberOf'),
        sa.Column('role_mapping', sa.JSON(), nullable=True),
        sa.Column('connection_timeout', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('read_timeout', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('max_connections', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('retry_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('auto_sync_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sync_interval_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('last_sync', sa.DateTime(), nullable=True),
        sa.Column('sync_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_ldap_configs_id'), 'ldap_configs', ['id'], unique=False)
    
    # Create IP ranges table
    op.create_table('ip_ranges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ip_range', sa.String(100), nullable=False),
        sa.Column('ip_start', sa.String(45), nullable=True),
        sa.Column('ip_end', sa.String(45), nullable=True),
        sa.Column('range_type', sa.String(20), nullable=False, server_default='cidr'),
        sa.Column('is_restrictive', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_ip_ranges_id'), 'ip_ranges', ['id'], unique=False)
    
    # Create user IP ranges association table
    op.create_table('user_ip_ranges',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('ip_range_id', sa.Integer(), nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['ip_range_id'], ['ip_ranges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'ip_range_id')
    )
    
    # Create LDAP sync logs table
    op.create_table('ldap_sync_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ldap_config_id', sa.Integer(), nullable=False),
        sa.Column('sync_type', sa.String(20), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='running'),
        sa.Column('users_created', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('users_updated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('users_deactivated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('groups_processed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('errors_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['ldap_config_id'], ['ldap_configs.id'], )
    )
    op.create_index(op.f('ix_ldap_sync_logs_id'), 'ldap_sync_logs', ['id'], unique=False)


def downgrade():
    # Drop LDAP sync logs table
    op.drop_index(op.f('ix_ldap_sync_logs_id'), table_name='ldap_sync_logs')
    op.drop_table('ldap_sync_logs')
    
    # Drop user IP ranges association table
    op.drop_table('user_ip_ranges')
    
    # Drop IP ranges table
    op.drop_index(op.f('ix_ip_ranges_id'), table_name='ip_ranges')
    op.drop_table('ip_ranges')
    
    # Drop LDAP configurations table
    op.drop_index(op.f('ix_ldap_configs_id'), table_name='ldap_configs')
    op.drop_table('ldap_configs')
    
    # Remove new columns from users table
    op.alter_column('users', 'hashed_password', nullable=False)
    op.drop_column('users', 'last_ldap_sync')
    op.drop_column('users', 'ldap_uid')
    op.drop_column('users', 'ldap_dn')
    op.drop_column('users', 'auth_source')
