"""Enhance Operations and Jobs models

Revision ID: enhance_ops_jobs
Revises: ldap_ip_range_integration
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enhance_ops_jobs'
down_revision = 'ldap_ip_range_integration'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to operations table
    op.add_column('operations', sa.Column('awx_job_template_id', sa.String(50), nullable=True))
    op.add_column('operations', sa.Column('awx_job_template_name', sa.String(255), nullable=True))
    op.add_column('operations', sa.Column('awx_inventory_source', sa.String(50), nullable=True, default='assets'))
    op.add_column('operations', sa.Column('awx_limit', sa.String(255), nullable=True))
    op.add_column('operations', sa.Column('awx_tags', sa.String(255), nullable=True))
    op.add_column('operations', sa.Column('awx_skip_tags', sa.String(255), nullable=True))
    op.add_column('operations', sa.Column('awx_verbosity', sa.Integer(), nullable=True, default=0))
    
    op.add_column('operations', sa.Column('api_auth_type', sa.String(20), nullable=True, default='none'))
    op.add_column('operations', sa.Column('api_auth_credentials', sa.String(500), nullable=True))
    op.add_column('operations', sa.Column('api_timeout', sa.Integer(), nullable=True, default=30))
    
    op.add_column('operations', sa.Column('script_type', sa.String(20), nullable=True))
    op.add_column('operations', sa.Column('script_content', sa.Text(), nullable=True))
    op.add_column('operations', sa.Column('script_file_path', sa.String(500), nullable=True))
    op.add_column('operations', sa.Column('script_timeout', sa.Integer(), nullable=True, default=300))
    op.add_column('operations', sa.Column('script_working_directory', sa.String(500), nullable=True))
    
    op.add_column('operations', sa.Column('target_type', sa.String(20), nullable=True, default='assets'))
    op.add_column('operations', sa.Column('target_assets', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('operations', sa.Column('target_asset_groups', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('operations', sa.Column('target_labels', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    op.add_column('operations', sa.Column('credential_id', sa.Integer(), nullable=True))
    op.add_column('operations', sa.Column('schedule_enabled', sa.Boolean(), nullable=True, default=False))
    op.add_column('operations', sa.Column('schedule_cron', sa.String(100), nullable=True))
    op.add_column('operations', sa.Column('schedule_timezone', sa.String(50), nullable=True, default='UTC'))
    op.add_column('operations', sa.Column('created_by', sa.Integer(), nullable=True))
    
    # Add foreign key constraint for credential_id
    op.create_foreign_key('fk_operations_credential_id', 'operations', 'credentials', ['credential_id'], ['id'])
    op.create_foreign_key('fk_operations_created_by', 'operations', 'users', ['created_by'], ['id'])
    
    # Add new columns to jobs table
    op.add_column('jobs', sa.Column('total_assets', sa.Integer(), nullable=True, default=0))
    op.add_column('jobs', sa.Column('processed_assets', sa.Integer(), nullable=True, default=0))
    op.add_column('jobs', sa.Column('summary', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    op.add_column('jobs', sa.Column('awx_job_id', sa.String(50), nullable=True))
    op.add_column('jobs', sa.Column('awx_job_url', sa.String(500), nullable=True))
    op.add_column('jobs', sa.Column('awx_inventory_id', sa.String(50), nullable=True))
    
    op.add_column('jobs', sa.Column('api_response_status', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('api_response_headers', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('jobs', sa.Column('api_response_body', sa.Text(), nullable=True))
    
    op.add_column('jobs', sa.Column('script_exit_code', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('script_stdout', sa.Text(), nullable=True))
    op.add_column('jobs', sa.Column('script_stderr', sa.Text(), nullable=True))
    
    op.add_column('jobs', sa.Column('created_by', sa.Integer(), nullable=True))
    
    # Add foreign key constraint for created_by
    op.create_foreign_key('fk_jobs_created_by', 'jobs', 'users', ['created_by'], ['id'])


def downgrade():
    # Remove foreign key constraints
    op.drop_constraint('fk_jobs_created_by', 'jobs', type_='foreignkey')
    op.drop_constraint('fk_operations_created_by', 'operations', type_='foreignkey')
    op.drop_constraint('fk_operations_credential_id', 'operations', type_='foreignkey')
    
    # Remove columns from jobs table
    op.drop_column('jobs', 'created_by')
    op.drop_column('jobs', 'script_stderr')
    op.drop_column('jobs', 'script_stdout')
    op.drop_column('jobs', 'script_exit_code')
    op.drop_column('jobs', 'api_response_body')
    op.drop_column('jobs', 'api_response_headers')
    op.drop_column('jobs', 'api_response_status')
    op.drop_column('jobs', 'awx_inventory_id')
    op.drop_column('jobs', 'awx_job_url')
    op.drop_column('jobs', 'awx_job_id')
    op.drop_column('jobs', 'summary')
    op.drop_column('jobs', 'processed_assets')
    op.drop_column('jobs', 'total_assets')
    
    # Remove columns from operations table
    op.drop_column('operations', 'created_by')
    op.drop_column('operations', 'schedule_timezone')
    op.drop_column('operations', 'schedule_cron')
    op.drop_column('operations', 'schedule_enabled')
    op.drop_column('operations', 'credential_id')
    op.drop_column('operations', 'target_labels')
    op.drop_column('operations', 'target_asset_groups')
    op.drop_column('operations', 'target_assets')
    op.drop_column('operations', 'target_type')
    op.drop_column('operations', 'script_working_directory')
    op.drop_column('operations', 'script_timeout')
    op.drop_column('operations', 'script_file_path')
    op.drop_column('operations', 'script_content')
    op.drop_column('operations', 'script_type')
    op.drop_column('operations', 'api_timeout')
    op.drop_column('operations', 'api_auth_credentials')
    op.drop_column('operations', 'api_auth_type')
    op.drop_column('operations', 'awx_verbosity')
    op.drop_column('operations', 'awx_skip_tags')
    op.drop_column('operations', 'awx_tags')
    op.drop_column('operations', 'awx_limit')
    op.drop_column('operations', 'awx_inventory_source')
    op.drop_column('operations', 'awx_job_template_name')
    op.drop_column('operations', 'awx_job_template_id')

