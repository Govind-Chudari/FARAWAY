"""add change history

Revision ID: a5f1b2c3d4e5
Revises: 406acbdd3e04
Create Date: 2026-08-22 13:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a5f1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = '406acbdd3e04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create change_records table
    op.create_table('change_records',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('snapshot', sa.JSON(), nullable=True),
        sa.Column('changed_by', sa.String(), nullable=False, server_default='system'),
        sa.Column('change_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_change_records_entity_type'), 'change_records', ['entity_type'], unique=False)
    op.create_index(op.f('ix_change_records_entity_id'), 'change_records', ['entity_id'], unique=False)
    op.create_index(op.f('ix_change_records_action'), 'change_records', ['action'], unique=False)
    op.create_index(op.f('ix_change_records_created_at'), 'change_records', ['created_at'], unique=False)

    tables_to_alter = ['segments', 'incidents', 'work_orders', 'drones', 'trains']
    
    for table_name in tables_to_alter:
        op.add_column(table_name, sa.Column('is_archived', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        op.add_column(table_name, sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=True))
        op.add_column(table_name, sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True))
        op.add_column(table_name, sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    tables_to_alter = ['segments', 'incidents', 'work_orders', 'drones', 'trains']
    for table_name in tables_to_alter:
        op.drop_column(table_name, 'deleted_at')
        op.drop_column(table_name, 'archived_at')
        op.drop_column(table_name, 'is_deleted')
        op.drop_column(table_name, 'is_archived')

    op.drop_index(op.f('ix_change_records_created_at'), table_name='change_records')
    op.drop_index(op.f('ix_change_records_action'), table_name='change_records')
    op.drop_index(op.f('ix_change_records_entity_id'), table_name='change_records')
    op.drop_index(op.f('ix_change_records_entity_type'), table_name='change_records')
    op.drop_table('change_records')
