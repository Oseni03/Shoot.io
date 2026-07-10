---
labels: ready-for-agent
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

A user opens the extension popup for the first time, enters their email and password, and sees their name and email as confirmation they're logged in. When they close and reopen the popup, they're still authenticated.

This requires three things to exist simultaneously:
1. `packages/shared/` — the `AuthService` class, `TokenStore` interface, `TokenPairSchema`, `UserResponseSchema`, `API_ENDPOINTS` constants, and `PROJECT` shared config (all extracted from `apps/web/`)
2. `apps/extension/` — WXT scaffold with React 19, Tailwind v4, Biome linting
3. A service worker with a `chrome.storage.local`-backed `TokenStore` and a `LOGIN` message handler; a popup with a login form that sends `LOGIN` to the worker and displays the authenticated view

The `packages/shared/` package is a pure TypeScript workspace. No React, no Next.js, no `window`. Its `AuthService` takes a generic HTTP client (any `fetch`-compatible function) and a `TokenStore` implementation.

The extension's service worker creates the `AuthService` with `fetch` and a `chrome.storage.local` token store. It registers message handlers that the popup calls via `chrome.runtime.sendMessage`.

The popup has three states: loading, login form, and authenticated. The login form has email + password inputs with basic validation (email format, password non-empty). The authenticated view shows the user's name, email, and a logout button (logout clears tokens and returns to login form).

No MFA, no registration, no password reset, no refresh token handling in this slice — those come later. For now, if login returns an MFA pending response, show an error message saying "MFA is enabled on this account" and direct the user to the web app.

## Risk

`Normal` — no database, no billing, no migrations.

## Acceptance criteria

- [ ] `npm run build` passes for `packages/shared/` (TypeScript compilation succeeds)
- [ ] `npm run lint` passes for `apps/extension/` (Biome check)
- [ ] Extension loads in Chrome as unpacked extension from `.output/chrome-mv3/`
- [ ] Popup shows login form on first open (not logged in)
- [ ] Entering valid credentials calls `POST /api/v1/auth/login` via service worker
- [ ] On success, popup shows authenticated view with user's name and email
- [ ] Closing and reopening the popup shows authenticated view without re-login
- [ ] Entering invalid credentials shows an inline error message
- [ ] Clicking logout clears the token and returns to the login form

## Blocked by

None — can start immediately.
