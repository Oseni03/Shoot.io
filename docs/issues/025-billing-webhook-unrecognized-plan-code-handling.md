---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`BillingService`'s webhook and transaction-verify handlers (`app/services/billing_service.py`) default to `PlanTier.FREE` whenever a Paystack `plan_code` isn't found in `CODE_PLAN_MAP`. If Paystack's dashboard plan codes ever drift from `settings.PAYSTACK_*_PLAN_CODE` (a new plan added on Paystack's side, a typo'd config value after a deploy, etc.), a legitimate paying org's webhook silently downgrades it to FREE — no error, no log signal an operator would notice before a customer complains about losing paid features.

Replace the silent default with a loud failure: raise/log an error-level event (structlog, matching this codebase's logging conventions) that includes the unrecognized `plan_code` and the org/transaction it came from, and do **not** change the org's plan tier on an unrecognized code — leave it as whatever it currently is rather than downgrading. If there's an existing alerting/paging path for backend errors in this codebase, wire into that; otherwise the structured error log is the minimum bar.

## Risk

`Billing` — touches the plan-tier-changing path in webhook and transaction-verify handling; a bug here risks either silently leaving a downgrade situation unresolved (no worse than today) or, if implemented wrong, blocking legitimate plan updates. Test both the "unrecognized code" and "recognized code" paths together to confirm the fix doesn't regress normal upgrades/downgrades.

## Acceptance criteria

- [ ] An unrecognized `plan_code` in a webhook payload no longer changes the org's `PlanTier`
- [ ] An unrecognized `plan_code` produces a structured error-level log entry including the plan_code and org/transaction identifiers
- [ ] A recognized `plan_code` still correctly updates the org's plan tier, exactly as before (no regression)
- [ ] New tests in `tests/services/test_billing_service.py` cover: unrecognized code leaves plan unchanged + logs error; recognized code still updates plan as expected
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
