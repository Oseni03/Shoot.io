"""
Resume ORM models — Resume, section tables, TailoredResume, JobDescription, UserMonthlyUsage.
"""

import datetime as _dt
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Resume(Base, TimestampMixin):
    __tablename__ = "resumes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(26), ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_master: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="resumes")
    experiences: Mapped[list["ResumeExperience"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    educations: Mapped[list["ResumeEducation"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    skills: Mapped[list["ResumeSkill"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    summary: Mapped["ResumeSummary | None"] = relationship(back_populates="resume", uselist=False, cascade="all, delete-orphan")
    projects: Mapped[list["ResumeProject"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    certifications: Mapped[list["ResumeCertification"]] = relationship(back_populates="resume", cascade="all, delete-orphan")
    tailored_versions: Mapped[list["TailoredResume"]] = relationship(
        back_populates="source_resume", foreign_keys="TailoredResume.source_resume_id"
    )

    __table_args__ = (
        Index("ix_resume_master_per_user", "user_id", unique=True, sqlite_where=text("is_master = 1"), postgresql_where=text("is_master = TRUE")),
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} title={self.title} master={self.is_master}>"


class ResumeExperience(Base, TimestampMixin):
    __tablename__ = "resume_experiences"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[_dt.date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[_dt.date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bullets: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="experiences")

    def __repr__(self) -> str:
        return f"<ResumeExperience id={self.id} company={self.company} title={self.title}>"


class ResumeEducation(Base, TimestampMixin):
    __tablename__ = "resume_educations"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=False, index=True)
    school: Mapped[str] = mapped_column(String(255), nullable=False)
    degree: Mapped[str | None] = mapped_column(String(255), nullable=True)
    field: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[_dt.date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[_dt.date | None] = mapped_column(Date, nullable=True)
    gpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="educations")

    def __repr__(self) -> str:
        return f"<ResumeEducation id={self.id} school={self.school}>"


class ResumeSkill(Base, TimestampMixin):
    __tablename__ = "resume_skills"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    proficiency: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="skills")

    def __repr__(self) -> str:
        return f"<ResumeSkill id={self.id} name={self.name}>"


class ResumeSummary(Base, TimestampMixin):
    __tablename__ = "resume_summaries"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), unique=True, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="summary")

    def __repr__(self) -> str:
        return f"<ResumeSummary id={self.id} resume_id={self.resume_id}>"


class ResumeProject(Base, TimestampMixin):
    __tablename__ = "resume_projects"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    technologies: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="projects")

    def __repr__(self) -> str:
        return f"<ResumeProject id={self.id} name={self.name}>"


class ResumeCertification(Base, TimestampMixin):
    __tablename__ = "resume_certifications"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    resume_id: Mapped[str] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    earned_date: Mapped[_dt.date | None] = mapped_column(Date, nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    resume: Mapped["Resume"] = relationship(back_populates="certifications")

    def __repr__(self) -> str:
        return f"<ResumeCertification id={self.id} name={self.name}>"


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    tailored_resumes: Mapped[list["TailoredResume"]] = relationship(back_populates="job_description")

    def __repr__(self) -> str:
        return f"<JobDescription id={self.id} title={self.job_title}>"


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(26), ForeignKey("users.id"), nullable=False, index=True)
    source_resume_id: Mapped[str | None] = mapped_column(String(26), ForeignKey("resumes.id"), nullable=True, index=True)
    job_description_id: Mapped[str] = mapped_column(String(26), ForeignKey("job_descriptions.id"), nullable=False, index=True)
    sections: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="tailored_resumes")
    source_resume: Mapped["Resume | None"] = relationship(
        back_populates="tailored_versions", foreign_keys=[source_resume_id]
    )
    job_description: Mapped["JobDescription"] = relationship(back_populates="tailored_resumes")

    def __repr__(self) -> str:
        return f"<TailoredResume id={self.id} user_id={self.user_id}>"


class UserMonthlyUsage(Base, TimestampMixin):
    __tablename__ = "user_monthly_usage"

    id: Mapped[str] = mapped_column(String(26), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(26), ForeignKey("users.id"), nullable=False, index=True)
    period_start: Mapped[_dt.date] = mapped_column(Date, nullable=False)
    shots_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship(back_populates="monthly_usage")

    __table_args__ = (
        UniqueConstraint("user_id", "period_start", name="uq_user_monthly_period"),
    )

    def __repr__(self) -> str:
        return f"<UserMonthlyUsage user_id={self.user_id} period={self.period_start} shots={self.shots_used}>"
