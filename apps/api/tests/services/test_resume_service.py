"""Tests for ResumeService and related services."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.exceptions import NotFoundError
from app.core.permissions import PlanLimits, assert_shot_available
from app.lib.ulid import new_ulid
from app.models.organization import PlanTier
from app.models.resume import Resume
from app.models.user import User
from app.repositories.resume_repo import ResumeRepository
from app.schemas.resume import ResumeCreateRequest, ExperienceRequest, SkillRequest, SummaryRequest
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

    with pytest.raises(NotFoundError, match="Master resume"):
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

    for _ in range(3):
        await svc.record_shot(user.id)

    # PRO is unlimited
    assert await svc.can_shoot(user.id, PlanTier.PRO) is True
    remaining = await svc.get_shots_remaining(user.id, PlanTier.PRO)
    assert remaining == -1  # unlimited


@pytest.mark.asyncio
async def test_shot_remaining_response(db_session: AsyncSession) -> None:
    user = User(id=new_ulid(), email="remaining@test.com", hashed_password="hash")
    db_session.add(user)
    await db_session.flush()

    svc = ShotService(db_session)
    result = await svc.remaining_response(user.id, PlanTier.FREE)
    assert result["shots_remaining"] == 3
    assert "period_end" in result


# ── TailoringService ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_tailoring_service_basic(db_session: AsyncSession) -> None:
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

    service = TailoringService()
    sections = await service.tailor(resume, "Job description for Python dev")

    assert "experiences" in sections
    assert len(sections["experiences"]) == 1
    assert sections["experiences"][0]["company"] == "Acme"
    assert "skills" in sections
    assert sections["skills"][0]["name"] == "Python"
    assert "summary" in sections


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
    assert fields["current_title"] == "Engineer"
    assert fields["current_company"] == "Acme"
    assert fields["skills"] == "Python, React"
