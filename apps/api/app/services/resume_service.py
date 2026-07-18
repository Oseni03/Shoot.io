"""Resume service — CRUD for resumes with master invariant enforcement."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.lib.logger import logger
from app.lib.ulid import new_ulid
from app.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeExperience,
    ResumeProject,
    ResumeSkill,
    ResumeSummary,
)
from app.repositories.resume_repo import ResumeRepository
from app.schemas.resume import ResumeCreateRequest, ResumeUpdateRequest


class ResumeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ResumeRepository(db)

    async def create(self, user_id: str, payload: ResumeCreateRequest) -> Resume:
        if payload.is_master:
            await self.repo.unset_master_for_user(user_id)

        resume = Resume(
            id=new_ulid(),
            user_id=user_id,
            title=payload.title,
            is_master=payload.is_master,
        )
        await self.repo.create(resume)

        await self._create_sections(resume.id, payload)
        await self.db.flush()
        await self.db.refresh(resume)

        logger.info("resume.created", resume_id=resume.id, user_id=user_id)
        return await self._load_with_sections(resume.id)

    async def get_by_id(self, resume_id: str, user_id: str) -> Resume:
        resume = await self.repo.get_by_id(resume_id)
        if not resume or resume.user_id != user_id:
            raise NotFoundError("Resume")
        return resume

    async def get_master(self, user_id: str) -> Resume:
        resume = await self.repo.get_master(user_id)
        if not resume:
            raise BadRequestError("No master resume")
        return resume

    async def list_by_user(self, user_id: str) -> list[Resume]:
        return await self.repo.list_by_user(user_id)

    async def update(self, resume_id: str, user_id: str, payload: ResumeUpdateRequest) -> Resume:
        resume = await self.get_by_id(resume_id, user_id)

        if payload.title is not None:
            resume.title = payload.title

        fields_set = payload.model_fields_set
        section_models: dict[str, type] = {
            "experiences": ResumeExperience,
            "educations": ResumeEducation,
            "skills": ResumeSkill,
            "summary": ResumeSummary,
            "projects": ResumeProject,
            "certifications": ResumeCertification,
        }

        for field_name, model_cls in section_models.items():
            if field_name not in fields_set:
                continue
            value = getattr(payload, field_name)
            await self.repo.delete_section(resume_id, model_cls)
            if value is None:
                continue
            if field_name == "summary":
                self.db.add(ResumeSummary(id=new_ulid(), resume_id=resume_id, **value.model_dump()))
            else:
                for item in value:
                    self.db.add(model_cls(id=new_ulid(), resume_id=resume_id, **item.model_dump()))

        await self.repo.save(resume)

        logger.info("resume.updated", resume_id=resume.id, user_id=user_id)
        return await self._load_with_sections(resume.id)

    async def set_master(self, resume_id: str, user_id: str) -> Resume:
        resume = await self.get_by_id(resume_id, user_id)
        if resume.is_master:
            return resume

        await self.repo.unset_master_for_user(user_id)
        resume.is_master = True
        await self.repo.save(resume)

        logger.info("resume.set_master", resume_id=resume.id, user_id=user_id)
        return await self._load_with_sections(resume.id)

    async def delete(self, resume_id: str, user_id: str) -> None:
        resume = await self.get_by_id(resume_id, user_id)
        await self.repo.delete(resume)
        logger.info("resume.deleted", resume_id=resume_id, user_id=user_id)

    # ── Internal ──────────────────────────────────────────────────────

    async def _create_sections(self, resume_id: str, payload: ResumeCreateRequest | ResumeUpdateRequest) -> None:
        for exp in payload.experiences or []:
            self.db.add(ResumeExperience(id=new_ulid(), resume_id=resume_id, **exp.model_dump()))
        for edu in payload.educations or []:
            self.db.add(ResumeEducation(id=new_ulid(), resume_id=resume_id, **edu.model_dump()))
        for skill in payload.skills or []:
            self.db.add(ResumeSkill(id=new_ulid(), resume_id=resume_id, **skill.model_dump()))
        if payload.summary:
            self.db.add(ResumeSummary(id=new_ulid(), resume_id=resume_id, **payload.summary.model_dump()))
        for proj in payload.projects or []:
            self.db.add(ResumeProject(id=new_ulid(), resume_id=resume_id, **proj.model_dump()))
        for cert in payload.certifications or []:
            self.db.add(ResumeCertification(id=new_ulid(), resume_id=resume_id, **cert.model_dump()))

    async def _load_with_sections(self, resume_id: str) -> Resume:
        result = await self.repo.get_by_id(resume_id)
        if not result:
            raise NotFoundError("Resume")
        return result
