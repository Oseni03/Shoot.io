"""Tests for resume API endpoints."""

import pytest
from httpx import AsyncClient


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
async def test_shoot_success(client: AsyncClient, auth_headers: dict[str, str]) -> None:
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
