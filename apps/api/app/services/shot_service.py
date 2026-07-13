"""Shot service — usage tracking and plan limit enforcement for resume tailoring.

Tracks how many "shots" (tailoring actions) a user has consumed in the
current monthly period and enforces plan-specific limits.
"""

from datetime import UTC, date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PaymentRequiredError
from app.core.permissions import assert_shot_available
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

    def _next_period_end(self) -> str:
        now = datetime.now(UTC)
        if now.month == 12:
            end = datetime(now.year + 1, 1, 1, tzinfo=UTC)
        else:
            end = datetime(now.year, now.month + 1, 1, tzinfo=UTC)
        return end.isoformat()

    async def can_shoot(self, user_id: str, plan: PlanTier) -> bool:
        used = await self.get_shots_used(user_id)
        try:
            assert_shot_available(plan, used)
            return True
        except PaymentRequiredError:
            return False

    async def assert_can_shoot(self, user_id: str, plan: PlanTier) -> None:
        used = await self.get_shots_used(user_id)
        assert_shot_available(plan, used)

    async def record_shot(self, user_id: str) -> None:
        period = self._current_period_start()
        await self.repo.create_or_increment_usage(user_id, period)
        logger.info("shot.recorded", user_id=user_id, period=str(period))

    async def get_shots_used(self, user_id: str) -> int:
        period = self._current_period_start()
        return await self.repo.get_shots_used_in_period(user_id, period)

    async def get_shots_remaining(self, user_id: str, plan: PlanTier) -> int:
        from app.core.permissions import PlanLimits

        limits = PlanLimits.for_plan(plan)
        if limits.max_shots_per_month is None:
            return -1
        used = await self.get_shots_used(user_id)
        return max(0, limits.max_shots_per_month - used)

    async def remaining_response(self, user_id: str, plan: PlanTier) -> dict:
        used = await self.get_shots_used(user_id)
        from app.core.permissions import PlanLimits

        limits = PlanLimits.for_plan(plan)
        if limits.max_shots_per_month is None:
            return {"shots_remaining": -1, "period_end": self._next_period_end()}
        remaining = max(0, limits.max_shots_per_month - used)
        return {"shots_remaining": remaining, "period_end": self._next_period_end()}
