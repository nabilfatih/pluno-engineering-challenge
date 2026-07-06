"""Drop saved update summary

Revision ID: a1f0f6c3b7d4
Revises: 7fb33efc1c2e
Create Date: 2026-07-06 16:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1f0f6c3b7d4"
down_revision: Union[str, None] = "7fb33efc1c2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("saved_updates", "summary")


def downgrade() -> None:
    op.add_column(
        "saved_updates",
        sa.Column("summary", sa.String(length=600), nullable=False, server_default=""),
    )
    op.alter_column("saved_updates", "summary", server_default=None)
