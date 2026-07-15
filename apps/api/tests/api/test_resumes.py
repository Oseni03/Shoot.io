"""Tests for resume API endpoints."""

import json

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_create_resume(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/resumes",
        json={"title": "My Resume"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "My Resume"
    assert data["is_master"] is False
    assert data["user_id"] is not None
    assert "experiences" in data
    assert "educations" in data
    assert "skills" in data


@pytest.mark.asyncio
async def test_create_resume_master(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/resumes",
        json={"title": "Master Resume", "is_master": True},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["is_master"] is True


@pytest.mark.asyncio
async def test_create_resume_with_sections(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/resumes",
        json={
            "title": "Full Resume",
            "is_master": True,
            "experiences": [
                {
                    "company": "Acme Corp",
                    "title": "Engineer",
                    "location": "NYC",
                    "bullets": ["Built things", "Shipped features"],
                    "sort_order": 0,
                }
            ],
            "educations": [
                {
                    "school": "MIT",
                    "degree": "BS",
                    "field": "CS",
                    "sort_order": 0,
                }
            ],
            "skills": [{"name": "Python", "proficiency": 5, "sort_order": 0}],
            "summary": {"content": "Great engineer with 10 years experience."},
            "projects": [{"name": "Resumio", "description": "AI resume builder", "technologies": ["Python", "React"], "sort_order": 0}],
            "certifications": [{"name": "AWS SA", "issuer": "Amazon", "sort_order": 0}],
        },
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert len(data["experiences"]) == 1
    assert data["experiences"][0]["company"] == "Acme Corp"
    assert len(data["educations"]) == 1
    assert data["educations"][0]["school"] == "MIT"
    assert len(data["skills"]) == 1
    assert data["skills"][0]["name"] == "Python"
    assert data["summary"]["content"] == "Great engineer with 10 years experience."
    assert len(data["projects"]) == 1
    assert data["projects"][0]["name"] == "Resumio"
    assert len(data["certifications"]) == 1
    assert data["certifications"][0]["name"] == "AWS SA"


@pytest.mark.asyncio
async def test_list_resumes(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    await client.post(
        "/api/v1/resumes",
        json={"title": "Resume 1"},
        headers=auth_headers,
    )
    await client.post(
        "/api/v1/resumes",
        json={"title": "Resume 2"},
        headers=auth_headers,
    )
    res = await client.get("/api/v1/resumes", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_resume(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    create = await client.post(
        "/api/v1/resumes",
        json={"title": "My Resume"},
        headers=auth_headers,
    )
    resume_id = create.json()["id"]
    res = await client.get(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "My Resume"


@pytest.mark.asyncio
async def test_get_resume_not_found(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.get("/api/v1/resumes/nonexistent", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_set_master(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    r1 = await client.post(
        "/api/v1/resumes",
        json={"title": "First"},
        headers=auth_headers,
    )
    r2 = await client.post(
        "/api/v1/resumes",
        json={"title": "Second", "is_master": True},
        headers=auth_headers,
    )

    res = await client.post(
        f"/api/v1/resumes/{r1.json()['id']}/master",
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["is_master"] is True

    # Second should now NOT be master
    get_r2 = await client.get(
        f"/api/v1/resumes/{r2.json()['id']}",
        headers=auth_headers,
    )
    assert get_r2.json()["is_master"] is False


@pytest_asyncio.fixture
async def other_user_headers(db_session: AsyncSession) -> dict[str, str]:
    """Auth headers for a second, unrelated user — for ownership isolation tests."""
    from app.core.security import create_access_token
    from app.lib.ulid import new_ulid
    from app.models.user import User

    user = User(
        id=new_ulid(),
        email="other-user@example.com",
        hashed_password="hashed_placeholder",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest_asyncio.fixture
async def owner_resume_id(client: AsyncClient, auth_headers: dict[str, str]) -> str:
    """A resume owned by the primary auth_headers user — for ownership isolation tests."""
    create = await client.post(
        "/api/v1/resumes",
        json={"title": "Owner's Resume"},
        headers=auth_headers,
    )
    return create.json()["id"]


@pytest.mark.asyncio
async def test_get_resume_owned_by_other_user_returns_404(
    client: AsyncClient, owner_resume_id: str, other_user_headers: dict[str, str]
) -> None:
    res = await client.get(f"/api/v1/resumes/{owner_resume_id}", headers=other_user_headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_resume_owned_by_other_user_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    owner_resume_id: str,
    other_user_headers: dict[str, str],
) -> None:
    res = await client.put(
        f"/api/v1/resumes/{owner_resume_id}",
        json={"title": "Hijacked Title"},
        headers=other_user_headers,
    )
    assert res.status_code == 404

    # Original resume is untouched
    get = await client.get(f"/api/v1/resumes/{owner_resume_id}", headers=auth_headers)
    assert get.json()["title"] == "Owner's Resume"


@pytest.mark.asyncio
async def test_delete_resume_owned_by_other_user_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    owner_resume_id: str,
    other_user_headers: dict[str, str],
) -> None:
    res = await client.delete(f"/api/v1/resumes/{owner_resume_id}", headers=other_user_headers)
    assert res.status_code == 404

    # Original resume still exists for its owner
    get = await client.get(f"/api/v1/resumes/{owner_resume_id}", headers=auth_headers)
    assert get.status_code == 200


@pytest.mark.asyncio
async def test_set_master_owned_by_other_user_returns_404(
    client: AsyncClient,
    auth_headers: dict[str, str],
    owner_resume_id: str,
    other_user_headers: dict[str, str],
) -> None:
    res = await client.post(f"/api/v1/resumes/{owner_resume_id}/master", headers=other_user_headers)
    assert res.status_code == 404

    # Original resume's master flag is untouched
    get = await client.get(f"/api/v1/resumes/{owner_resume_id}", headers=auth_headers)
    assert get.json()["is_master"] is False


@pytest.mark.asyncio
async def test_list_resumes_does_not_include_other_users_resumes(
    client: AsyncClient,
    auth_headers: dict[str, str],
    owner_resume_id: str,
    other_user_headers: dict[str, str],
) -> None:
    await client.post("/api/v1/resumes", json={"title": "Theirs"}, headers=other_user_headers)

    res = await client.get("/api/v1/resumes", headers=auth_headers)
    titles = [r["title"] for r in res.json()]
    assert titles == ["Owner's Resume"]


@pytest.mark.asyncio
async def test_delete_resume(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    create = await client.post(
        "/api/v1/resumes",
        json={"title": "To Delete"},
        headers=auth_headers,
    )
    resume_id = create.json()["id"]
    res = await client.delete(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
    assert res.status_code == 204
    get = await client.get(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_shoot_no_master(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.post(
        "/api/v1/resumes/shoot",
        json={"job_description_text": "We need a Python developer."},
        headers=auth_headers,
    )
    assert res.status_code == 404
    assert "master" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_shoot_success(
    client: AsyncClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # Create master resume first
    await client.post(
        "/api/v1/resumes",
        json={
            "title": "Master",
            "is_master": True,
            "experiences": [{"company": "Acme", "title": "Engineer", "bullets": ["Built X"], "sort_order": 0}],
            "skills": [{"name": "Python", "sort_order": 0}],
            "summary": {"content": "Experienced engineer."},
        },
        headers=auth_headers,
    )

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps({
            "summary": "Tailored engineer.",
            "experiences": [{"company": "Acme", "title": "Engineer", "bullets": ["Built X"], "sort_order": 0}],
            "educations": [],
            "skills": [{"name": "Python", "sort_order": 0}],
            "projects": [],
            "certifications": [],
        })

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    res = await client.post(
        "/api/v1/resumes/shoot",
        json={
            "job_description_text": "We need a Python developer with 5 years experience.",
            "source_url": "https://indeed.com/viewjob?jk=123",
            "job_title": "Python Developer",
            "company": "Tech Corp",
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "tailored_resume_id" in data
    assert "auto_fill_fields" in data
    assert isinstance(data["auto_fill_fields"], dict)


@pytest.mark.asyncio
async def test_shots_remaining(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    res = await client.get("/api/v1/resumes/shots/remaining", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "shots_remaining" in data
    assert "period_end" in data


@pytest.mark.asyncio
async def test_shoot_free_plan_limit_returns_402(
    client: AsyncClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    await client.post(
        "/api/v1/resumes",
        json={"title": "Master", "is_master": True},
        headers=auth_headers,
    )

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps({
            "summary": "Tailored.",
            "experiences": [],
            "educations": [],
            "skills": [],
            "projects": [],
            "certifications": [],
        })

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    for _ in range(3):
        res = await client.post(
            "/api/v1/resumes/shoot",
            json={"job_description_text": "We need a developer with at least five years of experience in the field."},
            headers=auth_headers,
        )
        assert res.status_code == 200

    res = await client.post(
        "/api/v1/resumes/shoot",
        json={"job_description_text": "We need a developer with at least five years of experience in the field."},
        headers=auth_headers,
    )
    assert res.status_code == 402

    remaining = await client.get("/api/v1/resumes/shots/remaining", headers=auth_headers)
    assert remaining.json()["shots_remaining"] == 0


async def _pro_auth_headers(db_session: AsyncSession) -> dict[str, str]:
    from app.core.security import create_access_token
    from app.lib.ulid import new_ulid
    from app.models.membership import MemberRole, Membership
    from app.models.organization import Organization, PlanTier
    from app.models.user import User

    user = User(
        id=new_ulid(),
        email="pro-shoot@example.com",
        hashed_password="hashed_placeholder",
        is_verified=True,
        is_active=True,
    )
    org = Organization(id=new_ulid(), name="Pro Org", slug="pro-org-shoot", plan=PlanTier.PRO)
    db_session.add_all([user, org])
    await db_session.flush()
    db_session.add(
        Membership(id=new_ulid(), user_id=user.id, organization_id=org.id, role=MemberRole.OWNER)
    )
    await db_session.flush()
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.mark.asyncio
async def test_shoot_pro_plan_never_limited(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    headers = await _pro_auth_headers(db_session)

    await client.post(
        "/api/v1/resumes",
        json={"title": "Master", "is_master": True},
        headers=headers,
    )

    async def mock_call_ai(_prompt: str) -> str:
        return json.dumps({
            "summary": "Tailored.",
            "experiences": [],
            "educations": [],
            "skills": [],
            "projects": [],
            "certifications": [],
        })

    monkeypatch.setattr("app.services.tailoring_service.call_ai", mock_call_ai)

    for _ in range(4):
        res = await client.post(
            "/api/v1/resumes/shoot",
            json={"job_description_text": "We need a developer with at least five years of experience in the field."},
            headers=headers,
        )
        assert res.status_code == 200

    remaining = await client.get("/api/v1/resumes/shots/remaining", headers=headers)
    assert remaining.json()["shots_remaining"] is None
