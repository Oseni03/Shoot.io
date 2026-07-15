"""Resume Pydantic schemas."""

from datetime import date, datetime

from pydantic import BaseModel


# ── Section schemas ─────────────────────────────────────────────────────

class ExperienceRequest(BaseModel):
    company: str
    title: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    bullets: list[str] = []
    sort_order: int = 0


class EducationRequest(BaseModel):
    school: str
    degree: str | None = None
    field: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    gpa: float | None = None
    sort_order: int = 0


class SkillRequest(BaseModel):
    name: str
    proficiency: int | None = None
    sort_order: int = 0


class SummaryRequest(BaseModel):
    content: str


class ProjectRequest(BaseModel):
    name: str
    description: str | None = None
    url: str | None = None
    technologies: list[str] = []
    sort_order: int = 0


class CertificationRequest(BaseModel):
    name: str
    issuer: str | None = None
    earned_date: date | None = None
    url: str | None = None
    sort_order: int = 0


# ── Resume CRUD ─────────────────────────────────────────────────────────

class ResumeCreateRequest(BaseModel):
    title: str
    is_master: bool = False
    experiences: list[ExperienceRequest] = []
    educations: list[EducationRequest] = []
    skills: list[SkillRequest] = []
    summary: SummaryRequest | None = None
    projects: list[ProjectRequest] = []
    certifications: list[CertificationRequest] = []


class ResumeUpdateRequest(BaseModel):
    title: str | None = None
    experiences: list[ExperienceRequest] | None = None
    educations: list[EducationRequest] | None = None
    skills: list[SkillRequest] | None = None
    summary: SummaryRequest | None = None
    projects: list[ProjectRequest] | None = None
    certifications: list[CertificationRequest] | None = None


# ── Response schemas ────────────────────────────────────────────────────

class ExperienceResponse(BaseModel):
    id: str
    resume_id: str
    company: str
    title: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    bullets: list[str] = []
    sort_order: int = 0

    model_config = {"from_attributes": True}


class EducationResponse(BaseModel):
    id: str
    resume_id: str
    school: str
    degree: str | None = None
    field: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    gpa: float | None = None
    sort_order: int = 0

    model_config = {"from_attributes": True}


class SkillResponse(BaseModel):
    id: str
    resume_id: str
    name: str
    proficiency: int | None = None
    sort_order: int = 0

    model_config = {"from_attributes": True}


class SummaryResponse(BaseModel):
    id: str
    resume_id: str
    content: str

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: str
    resume_id: str
    name: str
    description: str | None = None
    url: str | None = None
    technologies: list[str] = []
    sort_order: int = 0

    model_config = {"from_attributes": True}


class CertificationResponse(BaseModel):
    id: str
    resume_id: str
    name: str
    issuer: str | None = None
    earned_date: date | None = None
    url: str | None = None
    sort_order: int = 0

    model_config = {"from_attributes": True}


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    is_master: bool
    created_at: datetime
    updated_at: datetime
    experiences: list[ExperienceResponse] = []
    educations: list[EducationResponse] = []
    skills: list[SkillResponse] = []
    summary: SummaryResponse | None = None
    projects: list[ProjectResponse] = []
    certifications: list[CertificationResponse] = []

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    id: str
    user_id: str
    title: str
    is_master: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Shoot / tailoring ──────────────────────────────────────────────────

class ShootRequest(BaseModel):
    job_description_text: str
    source_url: str | None = None
    job_title: str | None = None
    company: str | None = None


class ShootResponse(BaseModel):
    tailored_resume_id: str
    auto_fill_fields: dict[str, str]


class ShotRemainingResponse(BaseModel):
    shots_remaining: int | None
    period_end: str


class TailoredResumeResponse(BaseModel):
    id: str
    user_id: str
    source_resume_id: str | None = None
    job_description_id: str
    sections: dict
    created_at: datetime

    model_config = {"from_attributes": True}
