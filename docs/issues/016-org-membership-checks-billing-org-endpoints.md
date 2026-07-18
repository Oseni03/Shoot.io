---
labels: implemented
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`app/api/v1/endpoints/billing.py` (`initialize_transaction`, `get_manage_url`, `cancel_subscription`) and `GET /organizations/{org_id}` in `app/api/v1/endpoints/organizations.py` load an org by path `org_id` and act on it without ever checking that the calling user is a member of that org. Every other org-scoped endpoint routes mutations through `OrganizationService`'s `_require_role`/`MembershipPolicy` gate — these four don't. Today any authenticated user can view another org's details, fetch its Paystack manage URL, initialize a transaction against it, or cancel its active subscription just by guessing/enumerating `org_id`.

Add the same membership check these endpoints are missing: at minimum `VIEWER` rank for the `GET` detail route, and a role check appropriate to billing mutations (recommend `ADMIN`, matching who can already manage billing elsewhere in the app) for the three billing routes. Reuse the existing `require_org_role()` dependency / `MembershipPolicy.ensure_role()` helper — do not hand-roll a new check.

## Risk

`Security`

- No DB or migration changes — this is an authorization-gate addition only.
- Touches live billing endpoints; verify no legitimate current caller (e.g. a background job) relies on the unauthenticated-membership shape.

## Acceptance criteria

- [ ] `GET /organizations/{org_id}` returns 403/404 for a caller with no membership in that org
- [ ] `POST /organizations/{org_id}/billing/initialize` returns 403/404 for a non-member
- [ ] `GET /organizations/{org_id}/billing/manage-url` returns 403/404 for a non-member
- [ ] `POST /organizations/{org_id}/billing/cancel` returns 403/404 for a non-member, and for a member below the required role
- [ ] A legitimate member/admin of the org can still perform all four actions (regression coverage)
- [ ] New tests in `tests/api/test_billing.py` and `tests/api/test_organizations.py` cover the cross-org-access-denied case for each of the four routes
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
