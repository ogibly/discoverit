"""add_api_keys_table_manual

Revision ID: add_api_keys_manual
Revises: bca5f0e2904e
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_api_keys_manual'
down_revision = 'bca5f0e2904e'
branch_labels = None
depends_on = None


def upgrade():
    # Create api_keys table
    op.create_table('api_keys',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('key_hash', sa.String(length=500), nullable=False),
        sa.Column('key_prefix', sa.String(length=20), nullable=False),
        sa.Column('permissions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('last_used', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash')
    )
    op.create_index(op.f('ix_api_keys_id'), 'api_keys', ['id'], unique=False)


def downgrade():
    # Drop api_keys table
    op.drop_index(op.f('ix_api_keys_id'), table_name='api_keys')
    op.drop_table('api_keys')
