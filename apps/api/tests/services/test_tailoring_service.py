"""Tests for TailoringService — AI-powered resume tailoring."""

import json

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AppError,
    BadRequestError,
    NotFoundError,
    TailoringValidationError,
)
from app.lib.ulid import new_ulid
from app.models.resume import JobDescription, TailoredResume
from app.models.user import User
from app.schemas.resume import (
    CertificationRequest,
    EducationRequest,
    ExperienceRequest,
    ProjectRequest,
    ResumeCreateRequest,
    SkillRequest,
    SummaryRequest,
)
from app.services.resume_service import ResumeService
from app.services.tailoring_service import TailoringService


# ── Helpers ──────────────────────────────────────────────────────────────

_SAMPLE_JD = (
    "Looking for a senior Python engineer with 5+ years of experience "
    "building scalable web applications, expertise in FastAPI, PostgreSQL, "
    "and cloud infrastructure on AWS."
)

VALID_SECTIONS = {
    "summary": "Tailored summary for the senior Python role.",
    "experiences": [
        {
            "company": "Acme",
            "title": "Senior Engineer",
            "location": "NYC",
            "start_date": "2021-01-01",
            "end_date": None,
            "is_current": True,
            "bullets": [
                "Built a high-throughput API serving 10M requests/day",
                "Led migration from monolith to microservices on AWS ECS",
            ],
            "sort_order": 0,
        }
    ],
    "educations": [
        {
            "school": "MIT",
            "degree": "BS",
            "field": "Computer Science",
            "start_date": "2012-09-01",
            "end_date": "2016-06-01",
            "gpa": 3.8,
            "sort_order": 0,
        }
    ],
    "skills": [{"name": "Python", "proficiency": 5, "sort_order": 0}],
    "projects": [
        {
            "name": "Resumio",
            "description": "AI-powered resume builder",
            "url": "https://resumio.example.com",
            "technologies": ["Python", "FastAPI", "React"],
            "sort_order": 0,
        }
    ],
    "certifications": [
        {
            "name": "AWS Solutions Architect",
            "issuer": "Amazon",
            "date": "2023-03-15",
            "url": None,
            "sort_order": 0,
        }
    ],
}


async def _create_user(db_session: AsyncSession) -> User:
    user = User(id=new_ulid(), email="tailor@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()
    return user


async def _create_master(
    db_session: AsyncSession, user_id: str, **overrides: str
):

    payload = ResumeCreateRequest(
        title=overrides.get("title", "Master"),
        is_master=True,
        experiences=[
            ExperienceRequest(
                company="Acme", title="Engineer", bullets=["Built X"], location="NYC"
            )
        ],
        educations=[EducationRequest(school="MIT", degree="BS", field="CS")],
        skills=[SkillRequest(name="Python", proficiency=5)],
        summary=SummaryRequest(content="Engineer with 5 years experience."),
        projects=[
            ProjectRequest(
                name="Resumio",
                description="AI resume builder",
                technologies=["Python", "FastAPI"],
            )
        ],
        certifications=[
            CertificationRequest(name="AWS SA", issuer="Amazon"),
        ],
    )
    return await ResumeService(db_session).create(user_id, payload)


# ── Validation tests ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tailor_short_jd_raises_error(db_session: AsyncSession) -> None:
    user = await _create_user(db_session)

    svc = TailoringService(db_session)

    with pytest.raises(BadRequestError, match="Job description too short"):
        await svc.tailor(
            master_resume_id="any", jd_text="Too short", user_id=user.id
        )


@pytest.mark.asyncio
async def test_tailor_nonexistent_master_raises_error(
    db_session: AsyncSession,
) -> None:
    user = await _create_user(db_session)

    svc = TailoringService(db_session)

    with pytest.raises(NotFoundError, match="Resume"):
        await svc.tailor(
            master_resume_id=new_ulid(),
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


# ── Happy path ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tailor_creates_tailored_resume(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(VALID_SECTIONS)

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_call_ai
    )

    svc = TailoringService(db_session)
    tailored = await svc.tailor(
        master_resume_id=master.id,
        jd_text=_SAMPLE_JD,
        user_id=user.id,
        jd_source_url="https://example.com/job/123",
        jd_title="Senior Python Engineer",
        jd_company="Tech Corp",
    )

    assert isinstance(tailored, TailoredResume)
    assert tailored.user_id == user.id
    assert tailored.source_resume_id == master.id
    assert tailored.sections == VALID_SECTIONS

    # Verify JobDescription was created
    assert tailored.job_description_id is not None
    jd = await db_session.get(JobDescription, tailored.job_description_id)
    assert jd is not None
    assert jd.raw_text == _SAMPLE_JD
    assert jd.source_url == "https://example.com/job/123"
    assert jd.job_title == "Senior Python Engineer"
    assert jd.company == "Tech Corp"


@pytest.mark.asyncio
async def test_tailor_section_keys_match_master(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)

    payload = ResumeCreateRequest(title="Minimal", is_master=True)
    master = await ResumeService(db_session).create(user.id, payload)

    empty_sections = {
        "summary": "",
        "experiences": [],
        "educations": [],
        "skills": [],
        "projects": [],
        "certifications": [],
    }

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(empty_sections)

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_call_ai
    )

    svc = TailoringService(db_session)
    tailored = await svc.tailor(
        master_resume_id=master.id,
        jd_text=_SAMPLE_JD,
        user_id=user.id,
    )

    expected_keys = {
        "summary",
        "experiences",
        "educations",
        "skills",
        "projects",
        "certifications",
    }
    assert set(tailored.sections.keys()) == expected_keys


@pytest.mark.asyncio
async def test_tailor_content_differs_from_master(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    original_summary = master.summary.content  # "Engineer with 5 years experience."

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(VALID_SECTIONS)

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_call_ai
    )

    svc = TailoringService(db_session)
    tailored = await svc.tailor(
        master_resume_id=master.id,
        jd_text=_SAMPLE_JD,
        user_id=user.id,
    )

    assert tailored.sections["summary"] != original_summary


# ── Error handling ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tailor_ai_error_wraps_app_error(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    async def mock_fail(_prompt: str) -> str:
        raise RuntimeError("API timeout")

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_fail
    )

    svc = TailoringService(db_session)
    with pytest.raises(AppError, match="AI call failed"):
        await svc.tailor(
            master_resume_id=master.id,
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


@pytest.mark.asyncio
async def test_tailor_invalid_json_raises_app_error(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    async def mock_bad_json(_prompt: str) -> str:
        return "not valid json at all"

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_bad_json
    )

    svc = TailoringService(db_session)
    with pytest.raises(AppError, match="AI returned invalid JSON"):
        await svc.tailor(
            master_resume_id=master.id,
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


@pytest.mark.asyncio
async def test_tailor_missing_sections_raises_app_error(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    async def mock_partial(_prompt: str) -> str:
        return json.dumps({"summary": "only this"})

    monkeypatch.setattr(
        "app.services.tailoring_service.call_ai", mock_partial
    )

    svc = TailoringService(db_session)
    with pytest.raises(AppError, match="missing required sections"):
        await svc.tailor(
            master_resume_id=master.id,
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


@pytest.mark.parametrize(
    "section",
    ["experiences", "educations", "skills", "projects", "certifications"],
)
@pytest.mark.asyncio
async def test_tailor_malformed_section_item_raises_tailoring_validation_error(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch, section: str
) -> None:
    """Each section's items must be objects with known fields — a section
    that's a list of bare strings previously reached AutoFillService and
    raised an unhandled AttributeError on .get()."""
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    malformed = {**VALID_SECTIONS, section: ["just a string"]}

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(malformed)

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    svc = TailoringService(db_session)
    with pytest.raises(TailoringValidationError):
        await svc.tailor(
            master_resume_id=master.id,
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


@pytest.mark.asyncio
async def test_tailor_malformed_summary_raises_tailoring_validation_error(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    malformed = {**VALID_SECTIONS, "summary": ["not", "a", "string"]}

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(malformed)

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    svc = TailoringService(db_session)
    with pytest.raises(TailoringValidationError):
        await svc.tailor(
            master_resume_id=master.id,
            jd_text=_SAMPLE_JD,
            user_id=user.id,
        )


# ── Prompt ────────────────────────────────────────────────────────────────


def test_prompt_is_versioned() -> None:
    from app.services.tailoring_service import TAILOR_PROMPT_V1

    assert isinstance(TAILOR_PROMPT_V1, str)
    assert len(TAILOR_PROMPT_V1) > 100


# ── Serialization helper tests ────────────────────────────────────────────


@pytest.mark.asyncio
async def test_serialize_resume_includes_all_sections(
    db_session: AsyncSession,
) -> None:
    user = await _create_user(db_session)
    master = await _create_master(db_session, user.id)

    svc = TailoringService(db_session)
    text = svc._serialize_resume(master)

    assert "Acme" in text
    assert "Engineer" in text
    assert "MIT" in text
    assert "Python" in text
    assert "Resumio" in text
    assert "AWS SA" in text
    assert "Engineer with 5 years experience" in text
