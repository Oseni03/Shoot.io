"""Resume repository — DB access for Resume, TailoredResume, JobDescription, UserMonthlyUsage."""

from datetime import date

from sqlalchemy import delete as sa_delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.lib.ulid import new_ulid
from app.models.resume import (
    JobDescription,
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeExperience,
    ResumeProject,
    ResumeSkill,
    ResumeSummary,
    TailoredResume,
    UserMonthlyUsage,
)


class ResumeRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, resume_id: str) -> Resume | None:
        result = await self.db.execute(
            select(Resume)
            .options(
                selectinload(Resume.experiences),
                selectinload(Resume.educations),
                selectinload(Resume.skills),
                selectinload(Resume.summary),
                selectinload(Resume.projects),
                selectinload(Resume.certifications),
            )
            .where(Resume.id == resume_id)
        )
        return result.scalar_one_or_none()

    async def get_master(self, user_id: str) -> Resume | None:
        result = await self.db.execute(
            select(Resume)
            .options(
                selectinload(Resume.experiences),
                selectinload(Resume.educations),
                selectinload(Resume.skills),
                selectinload(Resume.summary),
                selectinload(Resume.projects),
                selectinload(Resume.certifications),
            )
            .where(Resume.user_id == user_id, Resume.is_master == True)  # noqa: E712
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str) -> list[Resume]:
        result = await self.db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, resume: Resume) -> Resume:
        self.db.add(resume)
        await self.db.flush()
        await self.db.refresh(resume)
        return resume

    async def save(self, resume: Resume) -> Resume:
        await self.db.flush()
        await self.db.refresh(resume)
        return resume

    async def delete(self, resume: Resume) -> None:
        await self.db.delete(resume)
        await self.db.flush()

    async def unset_master_for_user(self, user_id: str) -> None:
        await self.db.execute(
            update(Resume)
            .where(Resume.user_id == user_id, Resume.is_master == True)  # noqa: E712
            .values(is_master=False)
        )

    # ── Section helpers ───────────────────────────────────────────────

    async def delete_sections(self, resume_id: str) -> None:
        for model in [ResumeExperience, ResumeEducation, ResumeSkill, ResumeSummary, ResumeProject, ResumeCertification]:
            await self.db.execute(
                sa_delete(model).where(model.resume_id == resume_id)
            )

    # ── JobDescription ────────────────────────────────────────────────

    async def create_job_description(self, jd: JobDescription) -> JobDescription:
        self.db.add(jd)
        await self.db.flush()
        await self.db.refresh(jd)
        return jd

    # ── TailoredResume ────────────────────────────────────────────────

    async def create_tailored_resume(self, tr: TailoredResume) -> TailoredResume:
        self.db.add(tr)
        await self.db.flush()
        await self.db.refresh(tr)
        return tr

    async def list_tailored_by_user(self, user_id: str) -> list[TailoredResume]:
        result = await self.db.execute(
            select(TailoredResume)
            .where(TailoredResume.user_id == user_id)
            .order_by(TailoredResume.created_at.desc())
        )
        return list(result.scalars().all())

    # ── UserMonthlyUsage ──────────────────────────────────────────────

    async def get_usage(self, user_id: str, period_start: date) -> UserMonthlyUsage | None:
        result = await self.db.execute(
            select(UserMonthlyUsage).where(
                UserMonthlyUsage.user_id == user_id,
                UserMonthlyUsage.period_start == period_start,
            )
        )
        return result.scalar_one_or_none()

    async def create_or_increment_usage(self, user_id: str, period_start: date) -> UserMonthlyUsage:
        existing = await self.get_usage(user_id, period_start)
        if existing:
            existing.shots_used += 1
            await self.db.flush()
            await self.db.refresh(existing)
            return existing
        usage = UserMonthlyUsage(
            id=new_ulid(),
            user_id=user_id,
            period_start=period_start,
            shots_used=1,
        )
        self.db.add(usage)
        await self.db.flush()
        await self.db.refresh(usage)
        return usage

    async def get_shots_used_in_period(self, user_id: str, period_start: date) -> int:
        usage = await self.get_usage(user_id, period_start)
        return usage.shots_used if usage else 0

    async def get_all_usage_for_user(self, user_id: str) -> list[UserMonthlyUsage]:
        result = await self.db.execute(
            select(UserMonthlyUsage)
            .where(UserMonthlyUsage.user_id == user_id)
            .order_by(UserMonthlyUsage.period_start.desc())
        )
        return list(result.scalars().all())
