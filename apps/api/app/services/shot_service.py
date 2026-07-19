"""Shot service — usage tracking and plan limit enforcement for resume tailoring.

Tracks how many "shots" (tailoring actions) a user has consumed in the
current monthly period and enforces plan-specific limits.
"""

import calendar
from datetime import UTC, date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PaymentRequiredError
from app.core.permissions import SHOT_LIMIT_EXCEEDED, PlanLimits, assert_shot_available
from app.lib.logger import logger
from app.models.organization import PlanTier
from app.repositories.resume_repo import ResumeRepository


class ShotService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ResumeRepository(db)

    def _current_period_start(self) -> date:
        now = datetime.now(UTC)
        return date(now.year, now.month, 1)

    def _current_period_end(self) -> str:
        now = datetime.now(UTC)
        last_day = calendar.monthrange(now.year, now.month)[1]
        return date(now.year, now.month, last_day).isoformat()

    async def can_shoot(self, user_id: str, plan: PlanTier) -> bool:
        used = await self.get_shots_used(user_id)
        try:
            assert_shot_available(plan, used)
            return True
        except PaymentRequiredError:
            return False

    async def assert_can_shoot(self, user_id: str, plan: PlanTier) -> None:
        """Read-only check — does NOT increment. Prefer assert_and_record_shot."""
        used = await self.get_shots_used(user_id)
        assert_shot_available(plan, used)

    async def assert_and_record_shot(self, user_id: str, plan: PlanTier) -> None:
        """Atomically increment shot count and assert the user hasn't exceeded their plan limit.

        This eliminates the race between check and increment.
        """
        period = self._current_period_start()
        new_count = await self.repo.create_or_increment_usage(user_id, period)
        limits = PlanLimits.for_plan(plan)
        if limits.max_shots_per_month is not None and new_count > limits.max_shots_per_month:
            raise PaymentRequiredError(
                f"Your plan allows {limits.max_shots_per_month} shots per month. "
                + SHOT_LIMIT_EXCEEDED,
                code="SHOT_LIMIT_EXCEEDED",
            )
        logger.info("shot.recorded", user_id=user_id, period=str(period))

    async def release_shot(self, user_id: str) -> None:
        """Undo a shot recorded by assert_and_record_shot() when the request
        it was recorded for ultimately failed (e.g. tailoring validation)."""
        period = self._current_period_start()
        await self.repo.decrement_usage(user_id, period)
        logger.info("shot.released", user_id=user_id, period=str(period))

    async def record_shot(self, user_id: str) -> None:
        """Increment shot count without checking limits. Prefer assert_and_record_shot."""
        period = self._current_period_start()
        await self.repo.create_or_increment_usage(user_id, period)
        logger.info("shot.recorded", user_id=user_id, period=str(period))

    async def get_shots_used(self, user_id: str) -> int:
        period = self._current_period_start()
        return await self.repo.get_shots_used_in_period(user_id, period)

    async def get_shots_remaining(self, user_id: str, plan: PlanTier) -> int | None:
        limits = PlanLimits.for_plan(plan)
        if limits.max_shots_per_month is None:
            return None
        used = await self.get_shots_used(user_id)
        return max(0, limits.max_shots_per_month - used)

    async def remaining_response(self, user_id: str, plan: PlanTier) -> dict:
        return {
            "shots_remaining": await self.get_shots_remaining(user_id, plan),
            "period_end": self._current_period_end(),
        }
