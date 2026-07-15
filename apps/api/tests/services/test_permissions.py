"""Tests for plan-based permission enforcement."""

import pytest

from app.core.exceptions import PaymentRequiredError
from app.core.permissions import (
    PlanLimits,
    assert_feature_available,
    assert_member_limit,
    assert_shot_available,
)
from app.models.organization import PlanTier


def test_free_plan_limits() -> None:
    limits = PlanLimits.for_plan(PlanTier.FREE)
    assert limits.max_members == 5
    assert limits.sso_enabled is False
    assert limits.audit_log_retention_days == 7
    assert limits.max_shots_per_month == 3


def test_pro_plan_limits() -> None:
    limits = PlanLimits.for_plan(PlanTier.PRO)
    assert limits.max_members == 50
    assert limits.priority_support is True
    assert limits.max_shots_per_month is None


def test_ultimate_plan_limits() -> None:
    limits = PlanLimits.for_plan(PlanTier.ULTIMATE)
    assert limits.max_members is None  # Unlimited
    assert limits.sso_enabled is True
    assert limits.mfa_required is True


def test_member_limit_enforced_on_free() -> None:
    with pytest.raises(PaymentRequiredError):
        assert_member_limit(PlanTier.FREE, current_count=5)  # At limit


def test_member_limit_not_exceeded() -> None:
    assert_member_limit(PlanTier.FREE, current_count=4)  # OK


def test_member_limit_unlimited_on_ultimate() -> None:
    assert_member_limit(PlanTier.ULTIMATE, current_count=9999)  # No limit


def test_sso_blocked_on_free() -> None:
    with pytest.raises(PaymentRequiredError):
        assert_feature_available(PlanTier.FREE, "sso")


def test_sso_allowed_on_ultimate() -> None:
    assert_feature_available(PlanTier.ULTIMATE, "sso")  # No exception


def test_shot_limit_enforced_on_free() -> None:
    with pytest.raises(PaymentRequiredError):
        assert_shot_available(PlanTier.FREE, current_usage=3)  # At limit


def test_shot_limit_not_exceeded_on_free() -> None:
    assert_shot_available(PlanTier.FREE, current_usage=2)  # OK


def test_shot_limit_unlimited_on_pro() -> None:
    assert_shot_available(PlanTier.PRO, current_usage=9999)  # No limit


def test_legacy_enterprise_plan_resolves_to_ultimate_limits() -> None:
    # Orgs still on the legacy PlanTier.ENTERPRISE value (pre subscription-sync)
    # must keep working until they're flipped to ULTIMATE.
    limits = PlanLimits.for_plan(PlanTier.ENTERPRISE)
    assert limits.max_members is None
    assert limits.sso_enabled is True
    assert limits.max_shots_per_month is None
