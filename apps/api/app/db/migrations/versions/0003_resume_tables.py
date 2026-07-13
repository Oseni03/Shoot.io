"""create resume, tailored_resume, job_description, user_monthly_usage tables

Revision ID: 0003_resume_tables
Revises: 0002_stripe_to_paystack
Create Date: 2026-07-13 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_resume_tables"
down_revision: str | None = "0002_stripe_to_paystack"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── resumes ──────────────────────────────────────────────────────
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("is_master", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])
    op.create_index("ix_resume_master_per_user", "resumes", ["user_id"], unique=True, sqlite_where=sa.text("is_master = 1"), postgresql_where=sa.text("is_master = TRUE"))

    # ── resume_experiences ───────────────────────────────────────────
    op.create_table(
        "resume_experiences",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("bullets", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_experiences_resume_id", "resume_experiences", ["resume_id"])

    # ── resume_educations ────────────────────────────────────────────
    op.create_table(
        "resume_educations",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("school", sa.String(255), nullable=False),
        sa.Column("degree", sa.String(255), nullable=True),
        sa.Column("field", sa.String(255), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("gpa", sa.Float(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_educations_resume_id", "resume_educations", ["resume_id"])

    # ── resume_skills ────────────────────────────────────────────────
    op.create_table(
        "resume_skills",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("proficiency", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_skills_resume_id", "resume_skills", ["resume_id"])

    # ── resume_summaries ─────────────────────────────────────────────
    op.create_table(
        "resume_summaries",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_summaries_resume_id", "resume_summaries", ["resume_id"], unique=True)

    # ── resume_projects ──────────────────────────────────────────────
    op.create_table(
        "resume_projects",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(512), nullable=True),
        sa.Column("technologies", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_projects_resume_id", "resume_projects", ["resume_id"])

    # ── resume_certifications ────────────────────────────────────────
    op.create_table(
        "resume_certifications",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("issuer", sa.String(255), nullable=True),
        sa.Column("earned_date", sa.Date(), nullable=True),
        sa.Column("url", sa.String(512), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resume_certifications_resume_id", "resume_certifications", ["resume_id"])

    # ── job_descriptions ─────────────────────────────────────────────
    op.create_table(
        "job_descriptions",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("source_url", sa.String(2048), nullable=True),
        sa.Column("job_title", sa.String(255), nullable=True),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── tailored_resumes ─────────────────────────────────────────────
    op.create_table(
        "tailored_resumes",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_resume_id", sa.String(26), sa.ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("job_description_id", sa.String(26), sa.ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sections", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tailored_resumes_user_id", "tailored_resumes", ["user_id"])
    op.create_index("ix_tailored_resumes_source_resume_id", "tailored_resumes", ["source_resume_id"])
    op.create_index("ix_tailored_resumes_job_description_id", "tailored_resumes", ["job_description_id"])

    # ── user_monthly_usage ───────────────────────────────────────────
    op.create_table(
        "user_monthly_usage",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("user_id", sa.String(26), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("shots_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "period_start", name="uq_user_monthly_period"),
    )
    op.create_index("ix_user_monthly_usage_user_id", "user_monthly_usage", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_monthly_usage")
    op.drop_table("tailored_resumes")
    op.drop_table("job_descriptions")
    op.drop_table("resume_certifications")
    op.drop_table("resume_projects")
    op.drop_table("resume_summaries")
    op.drop_table("resume_skills")
    op.drop_table("resume_educations")
    op.drop_table("resume_experiences")
    op.drop_table("resumes")
