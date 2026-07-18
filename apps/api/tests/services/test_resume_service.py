"""Tests for ResumeService and related services."""

import json

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import BadRequestError, NotFoundError, PaymentRequiredError
from app.core.permissions import PlanLimits, assert_shot_available
from app.lib.ulid import new_ulid
from app.models.organization import PlanTier
from app.models.resume import Resume
from app.models.user import User
from app.repositories.resume_repo import ResumeRepository
from app.schemas.resume import (
    ResumeCreateRequest,
    ResumeUpdateRequest,
    ExperienceRequest,
    EducationRequest,
    SkillRequest,
    SummaryRequest,
    ProjectRequest,
    CertificationRequest,
)
from app.services.resume_service import ResumeService
from app.services.shot_service import ShotService
from app.services.tailoring_service import TailoringService
from app.services.autofill_service import AutoFillService


@pytest.mark.asyncio
async def test_create_resume(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(title="My Resume", is_master=True)
    resume = await ResumeService(db_session).create(user.id, payload)

    assert resume.title == "My Resume"
    assert resume.is_master is True
    assert resume.user_id == user.id


@pytest.mark.asyncio
async def test_master_uniqueness(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ResumeService(db_session)

    r1 = await svc.create(user.id, ResumeCreateRequest(title="First", is_master=True))
    assert r1.is_master is True

    r2 = await svc.create(user.id, ResumeCreateRequest(title="Second", is_master=True))
    assert r2.is_master is True

    # First should no longer be master
    get_r1 = await svc.get_by_id(r1.id, user.id)
    assert get_r1.is_master is False


@pytest.mark.asyncio
async def test_get_master(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ResumeService(db_session)
    await svc.create(user.id, ResumeCreateRequest(title="Master", is_master=True))

    master = await svc.get_master(user.id)
    assert master.is_master is True
    assert master.title == "Master"


@pytest.mark.asyncio
async def test_get_master_not_found(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    with pytest.raises(BadRequestError, match="No master resume"):
        await ResumeService(db_session).get_master(user.id)


@pytest.mark.asyncio
async def test_create_with_sections(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Full Resume",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer", bullets=["Built X"])],
        skills=[SkillRequest(name="Python")],
        summary=SummaryRequest(content="Engineer."),
    )
    resume = await ResumeService(db_session).create(user.id, payload)

    assert len(resume.experiences) == 1
    assert resume.experiences[0].company == "Acme"
    assert len(resume.skills) == 1
    assert resume.skills[0].name == "Python"
    assert resume.summary is not None
    assert resume.summary.content == "Engineer."


@pytest.mark.asyncio
async def test_update_only_summary_leaves_other_sections_untouched(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="partial@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Original",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer", bullets=["Built X"])],
        educations=[EducationRequest(school="MIT", degree="BS")],
        skills=[SkillRequest(name="Python")],
        summary=SummaryRequest(content="Original summary."),
        projects=[ProjectRequest(name="Project A")],
        certifications=[CertificationRequest(name="AWS")],
    )
    svc = ResumeService(db_session)
    resume = await svc.create(user.id, payload)
    resume_id = resume.id

    updated = await svc.update(
        resume_id,
        user.id,
        ResumeUpdateRequest(summary=SummaryRequest(content="New summary.")),
    )

    assert updated.summary is not None
    assert updated.summary.content == "New summary."
    assert len(updated.experiences) == 1
    assert updated.experiences[0].company == "Acme"
    assert len(updated.educations) == 1
    assert updated.educations[0].school == "MIT"
    assert len(updated.skills) == 1
    assert updated.skills[0].name == "Python"
    assert len(updated.projects) == 1
    assert updated.projects[0].name == "Project A"
    assert len(updated.certifications) == 1
    assert updated.certifications[0].name == "AWS"


@pytest.mark.asyncio
async def test_update_only_experiences_replaces_it_leaves_others(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="partial2@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Original",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer")],
        educations=[EducationRequest(school="MIT", degree="BS")],
        skills=[SkillRequest(name="Python")],
        summary=SummaryRequest(content="Original summary."),
    )
    svc = ResumeService(db_session)
    resume = await svc.create(user.id, payload)
    resume_id = resume.id

    updated = await svc.update(
        resume_id,
        user.id,
        ResumeUpdateRequest(
            experiences=[ExperienceRequest(company="Newco", title="Senior")]
        ),
    )

    assert len(updated.experiences) == 1
    assert updated.experiences[0].company == "Newco"
    assert len(updated.educations) == 1
    assert updated.educations[0].school == "MIT"
    assert len(updated.skills) == 1
    assert updated.skills[0].name == "Python"
    assert updated.summary is not None
    assert updated.summary.content == "Original summary."


@pytest.mark.asyncio
async def test_update_explicit_empty_list_clears_that_section(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="partial3@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Original",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer")],
        skills=[SkillRequest(name="Python")],
    )
    svc = ResumeService(db_session)
    resume = await svc.create(user.id, payload)
    resume_id = resume.id

    updated = await svc.update(
        resume_id,
        user.id,
        ResumeUpdateRequest(experiences=[]),
    )

    assert len(updated.experiences) == 0
    assert len(updated.skills) == 1
    assert updated.skills[0].name == "Python"


@pytest.mark.asyncio
async def test_update_full_payload_replaces_everything(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="fullreplace@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Original",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer")],
        skills=[SkillRequest(name="Python")],
        summary=SummaryRequest(content="Old summary."),
    )
    svc = ResumeService(db_session)
    resume = await svc.create(user.id, payload)
    resume_id = resume.id

    updated = await svc.update(
        resume_id,
        user.id,
        ResumeUpdateRequest(
            title="Updated",
            experiences=[ExperienceRequest(company="Newco", title="Senior")],
            educations=[EducationRequest(school="Harvard")],
            skills=[SkillRequest(name="Rust")],
            summary=SummaryRequest(content="New summary."),
            projects=[ProjectRequest(name="New Project")],
            certifications=[CertificationRequest(name="GCP")],
        ),
    )

    assert updated.title == "Updated"
    assert len(updated.experiences) == 1
    assert updated.experiences[0].company == "Newco"
    assert len(updated.educations) == 1
    assert updated.educations[0].school == "Harvard"
    assert len(updated.skills) == 1
    assert updated.skills[0].name == "Rust"
    assert updated.summary is not None
    assert updated.summary.content == "New summary."
    assert len(updated.projects) == 1
    assert updated.projects[0].name == "New Project"
    assert len(updated.certifications) == 1
    assert updated.certifications[0].name == "GCP"


@pytest.mark.asyncio
async def test_delete_resume(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ResumeService(db_session)
    resume = await svc.create(user.id, ResumeCreateRequest(title="To Delete"))
    await svc.delete(resume.id, user.id)

    with pytest.raises(NotFoundError):
        await svc.get_by_id(resume.id, user.id)


@pytest.mark.asyncio
async def test_list_by_user(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="user@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ResumeService(db_session)
    await svc.create(user.id, ResumeCreateRequest(title="A"))
    await svc.create(user.id, ResumeCreateRequest(title="B"))

    resumes = await svc.list_by_user(user.id)
    assert len(resumes) == 2


@pytest.mark.asyncio
async def test_list_by_user_ordered_by_created_at_desc(db_session: AsyncSession) -> None:
    from datetime import datetime, timedelta, UTC

    user = User(id=new_ulid(), email="order@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    base = datetime.now(UTC)
    older = Resume(id=new_ulid(), user_id=user.id, title="Older", is_master=False, created_at=base, updated_at=base)
    newer = Resume(
        id=new_ulid(),
        user_id=user.id,
        title="Newer",
        is_master=False,
        created_at=base + timedelta(minutes=5),
        updated_at=base,
    )
    db_session.add_all([older, newer])
    await db_session.flush()

    resumes = await ResumeRepository(db_session).list_by_user(user.id)

    assert [r.title for r in resumes] == ["Newer", "Older"]


# ── Plan limits ─────────────────────────────────────────────────────────────


def test_shot_plan_limits() -> None:
    free = PlanLimits.for_plan(PlanTier.FREE)
    assert free.max_shots_per_month == 3

    pro = PlanLimits.for_plan(PlanTier.PRO)
    assert pro.max_shots_per_month is None


def test_assert_shot_available_free() -> None:
    assert_shot_available(PlanTier.FREE, 0)  # OK
    assert_shot_available(PlanTier.FREE, 2)  # OK

    with pytest.raises(Exception) as exc:
        assert_shot_available(PlanTier.FREE, 3)
    assert "Upgrade" in str(exc.value)


def test_assert_shot_available_pro() -> None:
    assert_shot_available(PlanTier.PRO, 0)
    assert_shot_available(PlanTier.PRO, 999)  # Unlimited


# ── ShotService ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_shot_service_free_limit(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="shots@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)

    for i in range(3):
        assert await svc.can_shoot(user.id, PlanTier.FREE) is True
        await svc.record_shot(user.id)

    assert await svc.can_shoot(user.id, PlanTier.FREE) is False
    assert await svc.get_shots_used(user.id) == 3


@pytest.mark.asyncio
async def test_shot_service_pro_unlimited(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="pro@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)

    for _ in range(100):
        await svc.record_shot(user.id)

    # PRO is unlimited
    assert await svc.can_shoot(user.id, PlanTier.PRO) is True
    remaining = await svc.get_shots_remaining(user.id, PlanTier.PRO)
    assert remaining is None  # unlimited


@pytest.mark.asyncio
async def test_shot_remaining_response(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="remaining@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)
    result = await svc.remaining_response(user.id, PlanTier.FREE)
    assert result["shots_remaining"] == 3


@pytest.mark.asyncio
async def test_shot_remaining_decrements_to_zero_then_stays(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="decrement@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)

    expected = [3, 2, 1, 0]
    for want in expected:
        remaining = await svc.get_shots_remaining(user.id, PlanTier.FREE)
        assert remaining == want
        await svc.record_shot(user.id)

    # 4th shot already recorded above; a 5th call still reads 0, not negative
    assert await svc.get_shots_remaining(user.id, PlanTier.FREE) == 0


@pytest.mark.asyncio
async def test_shot_remaining_period_end_is_last_day_of_month(db_session: AsyncSession) -> None:
    import calendar
    from datetime import UTC, datetime

    user = User(id=new_ulid(), email="periodend@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)
    result = await svc.remaining_response(user.id, PlanTier.FREE)

    now = datetime.now(UTC)
    last_day = calendar.monthrange(now.year, now.month)[1]
    expected = f"{now.year:04d}-{now.month:02d}-{last_day:02d}"
    assert result["period_end"] == expected


# ── Atomic upsert / concurrency ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_assert_and_record_shot_free_limit(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="assert-record@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)

    for _ in range(3):
        await svc.assert_and_record_shot(user.id, PlanTier.FREE)

    assert await svc.get_shots_used(user.id) == 3

    with pytest.raises(PaymentRequiredError):
        await svc.assert_and_record_shot(user.id, PlanTier.FREE)

    assert await svc.get_shots_used(user.id) == 4


@pytest.mark.asyncio
async def test_assert_and_record_shot_pro_unlimited(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="assert-record-pro@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)

    for _ in range(100):
        await svc.assert_and_record_shot(user.id, PlanTier.PRO)

    assert await svc.get_shots_used(user.id) == 100


@pytest.mark.asyncio
async def test_create_or_increment_usage_no_integrity_error_on_race(db_session: AsyncSession) -> None:
    """Two concurrent create_or_increment_usage calls never raise IntegrityError."""
    import asyncio
    from datetime import date

    user = User(id=new_ulid(), email="race-insert@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    repo = ResumeRepository(db_session)
    period = date(2026, 7, 1)

    c1, c2 = await asyncio.gather(
        repo.create_or_increment_usage(user.id, period),
        repo.create_or_increment_usage(user.id, period),
    )

    results = sorted([c1, c2])
    assert results == [1, 2]
    assert await repo.get_shots_used_in_period(user.id, period) == 2


# ── TailoringService ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tailoring_service_basic(db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch) -> None:
    user = User(id=new_ulid(), email="tailor@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    payload = ResumeCreateRequest(
        title="Tailor Source",
        is_master=True,
        experiences=[ExperienceRequest(company="Acme", title="Engineer", bullets=["Built X"])],
        skills=[SkillRequest(name="Python")],
        summary=SummaryRequest(content="Engineer."),
    )
    resume = await ResumeService(db_session).create(user.id, payload)

    fake_sections = {
        "experiences": [{"company": "Acme", "title": "Engineer", "bullets": ["Built X (tailored)"]}],
        "educations": [],
        "skills": [{"name": "Python"}],
        "summary": "Tailored engineer.",
        "projects": [],
        "certifications": [],
    }

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps(fake_sections)

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    service = TailoringService(db_session)
    tailored = await service.tailor(
        master_resume_id=resume.id,
        jd_text="Looking for a Python developer with 5 years experience in web development.",
        user_id=user.id,
    )

    assert tailored.sections["experiences"][0]["company"] == "Acme"
    assert tailored.sections["skills"][0]["name"] == "Python"
    assert tailored.sections["summary"] == "Tailored engineer."


# ── AutoFillService ─────────────────────────────────────────────────────────


def test_autofill_basic() -> None:
    service = AutoFillService()
    sections = {
        "summary": "Experienced engineer.",
        "experiences": [
            {
                "company": "Acme",
                "title": "Engineer",
                "bullets": ["Built X", "Shipped Y"],
            }
        ],
        "skills": [{"name": "Python"}, {"name": "React"}],
        "educations": [{"degree": "BS", "school": "MIT"}],
    }

    fields = service.map_fields(sections)
    assert fields["summary"] == "Experienced engineer."
    assert fields["headline"] == "Engineer"
    assert fields["experience_0_title"] == "Engineer"
    assert fields["experience_0_company"] == "Acme"
    assert fields["experience_0_bullets"] == "Built X\nShipped Y"
    assert fields["skills"] == "Python, React"
    assert fields["education_0_degree"] == "BS"
    assert fields["education_0_school"] == "MIT"

def test_autofill_with_user() -> None:
    service = AutoFillService()
    sections = {"summary": "Engineer."}
    fields = service.map_fields(sections, user={"full_name": "John Doe", "email": "john@example.com"})
    assert fields["name"] == "John Doe"
    assert fields["email"] == "john@example.com"
    assert fields["phone"] == ""

def test_autofill_empty() -> None:
    service = AutoFillService()
    fields = service.map_fields({})
    assert fields == {"phone": ""}
