"""Tests for billing API endpoints — focuses on org-membership authorization."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


async def _make_member(
    db_session: AsyncSession,
    *,
    email: str,
    role,
    org_slug: str,
    plan=None,
    paystack_customer_id: str | None = None,
):
    """Create a user, an org, and a membership linking them with the given role."""
    from app.core.security import create_access_token
    from app.lib.ulid import new_ulid
    from app.models.membership import Membership
    from app.models.organization import Organization, PlanTier
    from app.models.user import User

    user = User(
        id=new_ulid(),
        email=email,
        hashed_password="hashed_placeholder",
        is_verified=True,
        is_active=True,
    )
    org = Organization(
        id=new_ulid(),
        name=org_slug,
        slug=org_slug,
        plan=plan or PlanTier.FREE,
        paystack_customer_id=paystack_customer_id,
    )
    db_session.add_all([user, org])
    await db_session.flush()
    db_session.add(
        Membership(id=new_ulid(), user_id=user.id, organization_id=org.id, role=role)
    )
    await db_session.flush()
    headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    return org, headers


async def _make_outsider(db_session: AsyncSession, *, email: str) -> dict:
    """Create a user with no membership in any org."""
    from app.core.security import create_access_token
    from app.lib.ulid import new_ulid
    from app.models.user import User

    user = User(
        id=new_ulid(),
        email=email,
        hashed_password="hashed_placeholder",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


# ── initialize ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_initialize_transaction_non_member_forbidden(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.models.membership import MemberRole

    org, _owner_headers = await _make_member(
        db_session, email="owner-init@example.com", role=MemberRole.OWNER, org_slug="init-org"
    )
    outsider_headers = await _make_outsider(db_session, email="outsider-init@example.com")

    res = await client.post(
        f"/api/v1/billing/organizations/{org.id}/initialize",
        json={"plan": "pro", "callback_url": "http://localhost:3000/billing/callback"},
        headers=outsider_headers,
    )
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_initialize_transaction_admin_member_succeeds(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.models.membership import MemberRole
    from app.models.organization import PlanTier

    org, headers = await _make_member(
        db_session,
        email="admin-init@example.com",
        role=MemberRole.ADMIN,
        org_slug="init-org-admin",
    )

    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {"authorization_url": "https://checkout.paystack.com/test123"}
    }
    mock_response.raise_for_status = MagicMock()

    with (
        patch(
            "app.services.billing_service.PLAN_CODE_MAP",
            {PlanTier.PRO: "PLN_test"},
        ),
        patch("httpx.AsyncClient") as mock_client,
    ):
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=mock_response
        )
        res = await client.post(
            f"/api/v1/billing/organizations/{org.id}/initialize",
            json={"plan": "pro", "callback_url": "http://localhost:3000/billing/callback"},
            headers=headers,
        )

    assert res.status_code == 200
    assert res.json()["authorization_url"] == "https://checkout.paystack.com/test123"


# ── manage-url ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_manage_url_non_member_forbidden(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.models.membership import MemberRole

    org, _owner_headers = await _make_member(
        db_session,
        email="owner-manage@example.com",
        role=MemberRole.OWNER,
        org_slug="manage-org",
        paystack_customer_id="CUS_test",
    )
    outsider_headers = await _make_outsider(db_session, email="outsider-manage@example.com")

    res = await client.get(
        f"/api/v1/billing/organizations/{org.id}/manage",
        headers=outsider_headers,
    )
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_get_manage_url_admin_member_succeeds(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.models.membership import MemberRole

    org, headers = await _make_member(
        db_session,
        email="admin-manage@example.com",
        role=MemberRole.ADMIN,
        org_slug="manage-org-admin",
        paystack_customer_id="CUS_test123",
    )

    res = await client.get(
        f"/api/v1/billing/organizations/{org.id}/manage",
        headers=headers,
    )
    assert res.status_code == 200
    assert "CUS_test123" in res.json()["manage_url"]


# ── cancel ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_cancel_subscription_non_member_forbidden(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.models.membership import MemberRole

    org, _owner_headers = await _make_member(
        db_session, email="owner-cancel@example.com", role=MemberRole.OWNER, org_slug="cancel-org"
    )
    outsider_headers = await _make_outsider(db_session, email="outsider-cancel@example.com")

    res = await client.post(
        f"/api/v1/billing/organizations/{org.id}/cancel",
        headers=outsider_headers,
    )
    assert res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_cancel_subscription_member_below_required_role_forbidden(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.models.membership import MemberRole

    org, member_headers = await _make_member(
        db_session,
        email="member-cancel@example.com",
        role=MemberRole.MEMBER,
        org_slug="cancel-org-member",
    )

    res = await client.post(
        f"/api/v1/billing/organizations/{org.id}/cancel",
        headers=member_headers,
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_cancel_subscription_admin_member_succeeds(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    from app.lib.ulid import new_ulid
    from app.models.membership import MemberRole
    from app.models.subscription import Subscription, SubscriptionStatus
    from datetime import UTC, datetime

    org, headers = await _make_member(
        db_session,
        email="admin-cancel@example.com",
        role=MemberRole.ADMIN,
        org_slug="cancel-org-admin",
    )
    db_session.add(
        Subscription(
            id=new_ulid(),
            organization_id=org.id,
            paystack_sub_code="SUB_test",
            paystack_plan_code="PLN_test",
            status=SubscriptionStatus.ACTIVE,
            current_period_start=datetime.now(UTC),
            current_period_end=datetime.now(UTC),
        )
    )
    await db_session.flush()

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(
            return_value=mock_response
        )
        res = await client.post(
            f"/api/v1/billing/organizations/{org.id}/cancel",
            headers=headers,
        )

    assert res.status_code == 204
