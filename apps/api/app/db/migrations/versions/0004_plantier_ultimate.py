"""add ultimate value to plantier enum

Revision ID: 0004_plantier_ultimate
Revises: 0003_resume_tables
Create Date: 2026-07-15 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0004_plantier_ultimate"
down_revision: str | None = "0003_resume_tables"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Additive only — existing "enterprise" rows are left untouched and keep
    # working (see app.core.permissions legacy alias) until their next
    # subscription sync assigns them "ultimate".
    op.execute("ALTER TYPE plantier ADD VALUE IF NOT EXISTS 'ultimate'")


def downgrade() -> None:
    # Postgres can't drop a single enum value, so rebuild the type without it.
    # This fails if any row already holds 'ultimate' — per the rollback plan,
    # those rows must be set back to 'enterprise' first via a data-fix script.
    op.execute("ALTER TYPE plantier RENAME TO plantier_old")
    op.execute("CREATE TYPE plantier AS ENUM ('free', 'pro', 'enterprise')")
    op.execute(
        "ALTER TABLE organizations ALTER COLUMN plan TYPE plantier "
        "USING plan::text::plantier"
    )
    op.execute("DROP TYPE plantier_old")
