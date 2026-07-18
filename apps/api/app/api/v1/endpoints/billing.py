from fastapi import APIRouter, Header, Query, Request, status

from app.api.deps import CurrentOrg, CurrentUser, DBDep, require_org_role
from app.models.membership import MemberRole, Membership
from app.schemas.organization import BillingInitSchema, BillingVerifyResponse
from app.services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/organizations/{org_id}/initialize")
async def initialize_transaction(
    org: CurrentOrg,
    payload: BillingInitSchema,
    current_user: CurrentUser,
    db: DBDep,
    _membership: Membership = require_org_role(MemberRole.ADMIN),
) -> dict:
    """
    Step 1 — Initialize a Paystack transaction.
    Returns { authorization_url } — redirect the user there to pay.
    """
    url = await BillingService(db).initialize_transaction(
        org=org,
        plan=payload.plan,
        user_email=current_user.email,
        callback_url=payload.callback_url,
    )
    return {"authorization_url": url}


@router.get("/verify")
async def verify_transaction(
    reference: str = Query(..., description="The reference Paystack appends to your callback URL"),
    current_user: CurrentUser = None,  # type: ignore[assignment]
    db: DBDep = None,  # type: ignore[assignment]
) -> dict:
    """
    Step 2 — Verify a transaction after Paystack redirects to callback_url?reference=xxx.
    Syncs plan and subscription to the DB.
    """
    result = await BillingService(db).verify_transaction(reference)
    return {"plan": result["plan"], "organization_id": result["org_id"]}


@router.get("/organizations/{org_id}/manage")
async def get_manage_url(
    org: CurrentOrg,
    db: DBDep,
    _membership: Membership = require_org_role(MemberRole.ADMIN),
) -> dict:
    """Returns a URL to your own billing management page."""
    url = await BillingService(db).get_manage_url(org)
    return {"manage_url": url}


@router.post("/organizations/{org_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_subscription(
    org: CurrentOrg,
    db: DBDep,
    _membership: Membership = require_org_role(MemberRole.ADMIN),
) -> None:
    """Cancel the org's active subscription via Paystack API."""
    await BillingService(db).cancel_subscription(org)


@router.post("/webhooks/paystack", status_code=status.HTTP_200_OK)
async def paystack_webhook(
    request: Request,
    db: DBDep,
    x_paystack_signature: str = Header(alias="x-paystack-signature"),
) -> dict:
    """
    Paystack sends events here (HMAC-SHA512 signed).
    Must be publicly accessible — no auth middleware.
    """
    payload = await request.body()
    await BillingService(db).handle_webhook(payload, x_paystack_signature)
    return {"received": True}
