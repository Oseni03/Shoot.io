---
labels: implemented
---

## Parent

None — standalone hardening slice, surfaced during review of the [chrome-extension-boilerplate](../prd/chrome-extension-boilerplate.md) issue set.

## What to build

All three TOTP-code endpoints in `app/api/v1/endpoints/mfa.py` — `POST /mfa/verify`, `POST /mfa/disable`, `POST /mfa/validate` — take `code: str` as a bare function parameter, which FastAPI resolves as a **query parameter** since it isn't a Pydantic body model. A live 6-digit TOTP code is sensitive, short-lived material; passing it in the URL means it lands in server access logs and any intermediate proxy/APM logging by default, where a request body would not.

Move all three to a small Pydantic request body (`{ "code": str }` or a shared `TotpCodeRequest` schema) instead of a query param. This is a request-shape change only — no change to TOTP verification logic, `pyotp` usage, or token issuance.

Update the one client that depends on the current shape: the extension's `MFA_VALIDATE` handler in `apps/extension/src/entrypoints/background.ts` builds `${API_BASE}/mfa/validate?code=${encodeURIComponent(code)}` — change this to a JSON body POST. `Issue 003`'s note that "the endpoint uses a query param, not JSON body" becomes stale once this ships; no action needed on that issue file itself (historical record).

## Risk

`Normal` — no DB changes, no migration. Touches live auth endpoints, so verify existing MFA integration tests (`tests/api/test_mfa.py`) and the extension's `MFA_VALIDATE` tests (`background.test.ts`) are updated in the same change, not left calling the old shape.

## Acceptance criteria

- [ ] `POST /mfa/verify`, `POST /mfa/disable`, `POST /mfa/validate` all accept `code` via a JSON request body, not a query string
- [ ] No endpoint under `app/api/v1/endpoints/mfa.py` accepts TOTP code as a query parameter
- [ ] `apps/extension/src/entrypoints/background.ts`'s `MFA_VALIDATE` handler sends `code` in the POST body
- [ ] `tests/api/test_mfa.py` updated to POST the code in the body for all three endpoints; existing pass/fail assertions unchanged
- [ ] `background.test.ts`'s `MFA_VALIDATE` tests updated to assert a body payload instead of a query string; existing pass/fail assertions unchanged
- [ ] `pytest` passes for `tests/api/test_mfa.py`
- [ ] `npm test` passes for `apps/extension/`

## Out of scope

- No change to TOTP verification logic, valid-window handling, or MFA setup/provisioning flow
- No change to `/mfa/setup`'s response shape
- No web app changes (web app does not currently call these MFA endpoints directly)

## Blocked by

None — can start immediately.
