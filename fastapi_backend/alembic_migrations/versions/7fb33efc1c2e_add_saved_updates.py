"""Add saved updates

Revision ID: 7fb33efc1c2e
Revises: b389592974f8
Create Date: 2026-06-27 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7fb33efc1c2e"
down_revision: Union[str, None] = "b389592974f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_updates",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.String(length=600), nullable=False),
        sa.Column("request_text", sa.Text(), nullable=False),
        sa.Column("reviewed_suggestions", sa.JSON(), nullable=False),
        sa.Column("approved_count", sa.Integer(), nullable=False),
        sa.Column("rejected_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("saved_updates")
