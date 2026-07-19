"""Resume API endpoints — CRUD + shoot + shots remaining."""

from fastapi import APIRouter, Request, status

from app.api.deps import DBDep, VerifiedUser
from app.core.exceptions import TailoringValidationError
from app.lib.logger import logger
from app.models.organization import PlanTier
from app.models.user import User
from app.repositories.resume_repo import ResumeRepository
from app.schemas.resume import (
    ResumeCreateRequest,
    ResumeListResponse,
    ResumeResponse,
    ResumeUpdateRequest,
    ShootRequest,
    ShootResponse,
    ShotRemainingResponse,
    TailoredResumeResponse,
)
from app.services.autofill_service import AutoFillService
from app.services.resume_service import ResumeService
from app.services.shot_service import ShotService
from app.services.tailoring_service import TailoringService
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _resolve_plan(user: User) -> str:
    # memberships is ordered by created_at ascending (see User.memberships) —
    # earliest-joined org's plan gates shot limits, as a deterministic tiebreak.
    if user.memberships:
        return user.memberships[0].organization.plan.value
    return "free"


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_resume(
    payload: ResumeCreateRequest,
    db: DBDep,
    current_user: VerifiedUser,
) -> ResumeResponse:
    """Create a new resume with sections."""
    resume = await ResumeService(db).create(current_user.id, payload)
    return ResumeResponse.model_validate(resume)


@router.get("", response_model=list[ResumeListResponse])
async def list_resumes(
    db: DBDep,
    current_user: VerifiedUser,
) -> list[ResumeListResponse]:
    """List all resumes for the current user."""
    resumes = await ResumeService(db).list_by_user(current_user.id)
    return [ResumeListResponse.model_validate(r) for r in resumes]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    db: DBDep,
    current_user: VerifiedUser,
) -> ResumeResponse:
    """Get a resume by ID with all sections."""
    resume = await ResumeService(db).get_by_id(resume_id, current_user.id)
    return ResumeResponse.model_validate(resume)


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    payload: ResumeUpdateRequest,
    db: DBDep,
    current_user: VerifiedUser,
) -> ResumeResponse:
    """Update a resume and its sections."""
    resume = await ResumeService(db).update(resume_id, current_user.id, payload)
    return ResumeResponse.model_validate(resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    db: DBDep,
    current_user: VerifiedUser,
) -> None:
    """Delete a resume."""
    await ResumeService(db).delete(resume_id, current_user.id)


@router.post("/{resume_id}/master", response_model=ResumeResponse)
async def set_master(
    resume_id: str,
    db: DBDep,
    current_user: VerifiedUser,
) -> ResumeResponse:
    """Set a resume as the master resume (unsets any current master)."""
    resume = await ResumeService(db).set_master(resume_id, current_user.id)
    return ResumeResponse.model_validate(resume)


@router.post("/shoot", response_model=ShootResponse)
async def shoot(
    payload: ShootRequest,
    request: Request,
    db: DBDep,
    current_user: VerifiedUser,
) -> ShootResponse:
    """Tailor the master resume to a job description and return auto-fill fields.

    1. Get user's master resume (400 if none)
    2. Atomically increment shot count and check plan limit (402 if exceeded)
    3. Call tailoring service to produce tailored resume (also creates JD + TailoredResume)
    4. Call auto-fill service to map fields
    """
    resume_service = ResumeService(db)
    shot_service = ShotService(db)
    autofill_service = AutoFillService()

    master = await resume_service.get_master(current_user.id)

    plan = _resolve_plan(current_user)
    await shot_service.assert_and_record_shot(current_user.id, PlanTier(plan))

    tailoring_service = TailoringService(db)
    try:
        tailored = await tailoring_service.tailor(
            master_resume_id=master.id,
            jd_text=payload.job_description_text,
            user_id=current_user.id,
            jd_source_url=payload.source_url,
            jd_title=payload.job_title,
            jd_company=payload.company,
        )
    except TailoringValidationError:
        # The shot was already recorded above (atomic check-and-increment
        # happens before tailoring so concurrent requests can't race past the
        # limit) — release it since this request produced nothing usable.
        await shot_service.release_shot(current_user.id)
        raise

    auto_fill_fields = autofill_service.map_fields(
        tailored.sections,
        user={"full_name": current_user.full_name or "", "email": current_user.email},
    )

    await AuditLogService(db).log(
        action="resume.shoot",
        user_id=current_user.id,
        resource_type="tailored_resume",
        resource_id=tailored.id,
        request=request,
        meta={
            "resume_id": master.id,
            "job_description_id": tailored.job_description_id,
            "job_title": payload.job_title,
            "company": payload.company,
        },
    )

    logger.info(
        "resume.shoot",
        user_id=current_user.id,
        tailored_id=tailored.id,
        jd_id=tailored.job_description_id,
    )

    return ShootResponse(
        tailored_resume_id=tailored.id,
        auto_fill_fields=auto_fill_fields,
    )


@router.get("/shots/remaining", response_model=ShotRemainingResponse)
async def shots_remaining(
    db: DBDep,
    current_user: VerifiedUser,
) -> ShotRemainingResponse:
    """Get the number of remaining shots for the current billing period."""
    plan = _resolve_plan(current_user)
    result = await ShotService(db).remaining_response(current_user.id, PlanTier(plan))
    return ShotRemainingResponse(**result)


@router.get("/tailored", response_model=list[TailoredResumeResponse])
async def list_tailored_resumes(
    db: DBDep,
    current_user: VerifiedUser,
) -> list[TailoredResumeResponse]:
    """List all tailored resumes for the current user."""
    repo = ResumeRepository(db)
    tailored = await repo.list_tailored_by_user(current_user.id)
    return [TailoredResumeResponse.model_validate(t) for t in tailored]
