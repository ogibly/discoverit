"""Add enterprise enhancement models

Revision ID: enterprise_enhancement_001
Revises: h1a2b3c4d5e6_add_discovery_depth_and_scanner_ids_to_scan_tasks
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'enterprise_enhancement_001'
down_revision = 'h1a2b3c4d5e6_add_discovery_depth_and_scanner_ids_to_scan_tasks'
branch_labels = None
depends_on = None


def upgrade():
    # Create scan_templates table
    op.create_table('scan_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scan_config', sa.JSON(), nullable=False),
        sa.Column('scan_type', sa.String(length=50), nullable=False),
        sa.Column('is_system', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scan_templates_id'), 'scan_templates', ['id'], unique=False)
    op.create_index(op.f('ix_scan_templates_name'), 'scan_templates', ['name'], unique=False)

    # Create asset_templates table
    op.create_table('asset_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('device_type', sa.String(length=100), nullable=False),
        sa.Column('template_data', sa.JSON(), nullable=False),
        sa.Column('custom_fields_schema', sa.JSON(), nullable=True),
        sa.Column('auto_apply_rules', sa.JSON(), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_asset_templates_id'), 'asset_templates', ['id'], unique=False)
    op.create_index(op.f('ix_asset_templates_name'), 'asset_templates', ['name'], unique=False)

    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('resource_name', sa.String(length=255), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_id'), 'audit_logs', ['resource_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_type'), 'audit_logs', ['resource_type'], unique=False)

    # Create webhooks table
    op.create_table('webhooks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('secret', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=True),
        sa.Column('timeout_seconds', sa.Integer(), nullable=True),
        sa.Column('last_triggered', sa.DateTime(), nullable=True),
        sa.Column('success_count', sa.Integer(), nullable=True),
        sa.Column('failure_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create webhook_deliveries table
    op.create_table('webhook_deliveries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('webhook_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('response_body', sa.Text(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('attempt_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['webhook_id'], ['webhooks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_webhook_deliveries_created_at'), 'webhook_deliveries', ['created_at'], unique=False)

    # Create network_topology table
    op.create_table('network_topology',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_asset_id', sa.Integer(), nullable=False),
        sa.Column('target_asset_id', sa.Integer(), nullable=False),
        sa.Column('relationship_type', sa.String(length=50), nullable=False),
        sa.Column('connection_details', sa.JSON(), nullable=True),
        sa.Column('discovered_at', sa.DateTime(), nullable=True),
        sa.Column('last_verified', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['source_asset_id'], ['assets.id'], ),
        sa.ForeignKeyConstraint(['target_asset_id'], ['assets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create asset_metrics table
    op.create_table('asset_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_asset_metrics_metric_type'), 'asset_metrics', ['metric_type'], unique=False)
    op.create_index(op.f('ix_asset_metrics_timestamp'), 'asset_metrics', ['timestamp'], unique=False)

    # Create compliance_rules table
    op.create_table('compliance_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rule_type', sa.String(length=50), nullable=False),
        sa.Column('framework', sa.String(length=100), nullable=True),
        sa.Column('rule_definition', sa.JSON(), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create compliance_checks table
    op.create_table('compliance_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=True),
        sa.Column('asset_group_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('checked_at', sa.DateTime(), nullable=True),
        sa.Column('checked_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['asset_group_id'], ['asset_groups.id'], ),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.id'], ),
        sa.ForeignKeyConstraint(['checked_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['rule_id'], ['compliance_rules.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_compliance_checks_checked_at'), 'compliance_checks', ['checked_at'], unique=False)

    # Create notification_rules table
    op.create_table('notification_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_types', sa.JSON(), nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('notification_methods', sa.JSON(), nullable=False),
        sa.Column('recipients', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_method', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['rule_id'], ['notification_rules.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_notifications_created_at'), table_name='notifications')
    op.drop_table('notifications')
    op.drop_table('notification_rules')
    op.drop_index(op.f('ix_compliance_checks_checked_at'), table_name='compliance_checks')
    op.drop_table('compliance_checks')
    op.drop_table('compliance_rules')
    op.drop_index(op.f('ix_asset_metrics_timestamp'), table_name='asset_metrics')
    op.drop_index(op.f('ix_asset_metrics_metric_type'), table_name='asset_metrics')
    op.drop_table('asset_metrics')
    op.drop_table('network_topology')
    op.drop_index(op.f('ix_webhook_deliveries_created_at'), table_name='webhook_deliveries')
    op.drop_table('webhook_deliveries')
    op.drop_table('webhooks')
    op.drop_index(op.f('ix_audit_logs_resource_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_resource_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_asset_templates_name'), table_name='asset_templates')
    op.drop_index(op.f('ix_asset_templates_id'), table_name='asset_templates')
    op.drop_table('asset_templates')
    op.drop_index(op.f('ix_scan_templates_name'), table_name='scan_templates')
    op.drop_index(op.f('ix_scan_templates_id'), table_name='scan_templates')
    op.drop_table('scan_templates')
