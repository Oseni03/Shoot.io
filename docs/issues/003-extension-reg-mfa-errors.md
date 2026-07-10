---
labels: ready-for-agent
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

After [001](./001-extension-scaffold-login.md) the user can log in. This slice rounds out the authentication surface: registration, MFA challenge, password reset link, and comprehensive error states.

**Registration flow:** The popup has a toggle between login and register. Registration collects name, email, password (with the same validation rules the API enforces: 8+ chars, must contain uppercase and digit). On success, auto-logs in. On validation error, shows field-level messages.

**MFA challenge:** If the login response contains `mfa_pending`, the popup transitions to a TOTP input view. Submitting the TOTP completes the login via the MFA validate endpoint and returns a full token pair.

**Password reset:** The login form has a "Forgot password?" link that opens `{FRONTEND_URL}/reset-password` in a new tab. No in-extension reset flow.

**Error states:**
- Network error (API unreachable) — banner with retry button
- Invalid credentials — inline message below the form
- Account inactive — message + link to support
- Email already registered (during signup) — inline error
- MFA pending (before MFA slice, [001](./001-extension-scaffold-login.md) shows a static message; this slice replaces that with the actual challenge flow)

**Service worker additions:** `REGISTER`, `VERIFY_EMAIL`, `FORGOT_PASSWORD`, `RESET_PASSWORD`, `MFA_VALIDATE` message handlers. Popup calls these via the same message pattern.

## Risk

`Normal` — no database, no billing, no migrations.

## Acceptance criteria

- [ ] Popup has a working registration form that creates a new account via `POST /api/v1/auth/register`
- [ ] After registration, popup shows authenticated view (auto-logged in)
- [ ] Registration validates password rules client-side before submitting
- [ ] If the email is already taken, popup shows an inline error
- [ ] Login for an MFA-enabled account shows a TOTP input view
- [ ] Entering a valid TOTP completes login and shows authenticated view
- [ ] Entering an invalid TOTP shows an error
- [ ] "Forgot password?" link opens the web app's reset page in a new tab
- [ ] Network error shows a banner with a retry button
- [ ] Account deactivated shows an appropriate message

## Blocked by

[001 — Extension scaffold + login flow](./001-extension-scaffold-login.md) — the service worker and popup scaffold must exist first.
