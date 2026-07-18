---
labels: implemented
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

After [001](./001-extension-scaffold-login.md), the extension stores tokens and uses them for API calls, but has no mechanism to refresh an expired access token. This slice adds that.

**On-demand refresh:** When the popup or options page opens, before showing any UI, send a `REFRESH` message to the service worker. The service worker checks if the access token is still valid (or just always tries to refresh with the refresh token). If the refresh succeeds, the new tokens are stored and the UI proceeds authenticated. If it fails (refresh token expired or revoked), tokens are cleared and the UI shows the login form.

**Alarms-based refresh:** Register a `chrome.alarms` periodic alarm (e.g., every 15 minutes) in the service worker. On each alarm fire, attempt a silent refresh. This keeps the access token fresh even if the popup is rarely opened. Handle the case where Chrome suspends the service worker (alarms wake it up).

**Edge cases:**
- Refresh token is already expired → silent logout, no error shown until next popup open
- Network is down during refresh → next alarm or next popup open retries
- Refresh token is revoked (e.g., user logged out from web app) → silent logout
- Multiple popup instances try to refresh simultaneously (Chrome service worker is single-threaded, but messages can arrive concurrently) → ensure only one refresh in flight at a time

**Service worker additions:** `REFRESH` message handler, `alarms` listener, concurrency guard.

The `AuthService.refreshIfNeeded()` method from `packages/shared/` handles the actual token exchange. The service worker wraps it with the alarm schedule and concurrency guard.

## Risk

`Normal` — no database, no billing, no migrations.

## Acceptance criteria

- [ ] Opening the popup with an expired access token but a valid refresh token silently refreshes and shows the authenticated view
- [ ] Opening the popup with an expired refresh token shows the login form (no stale UI)
- [ ] A `chrome.alarms` periodic alarm fires and refreshes the token without user interaction
- [ ] If a refresh is already in flight, additional refresh requests are queued or skipped (no concurrent refreshes)
- [ ] Network errors during refresh are silently retried on the next cycle
- [ ] Logging out from the web app (which revokes the refresh token) causes the extension to show the login form on next popup open
- [ ] `npm run test` passes for any added Vitest tests around the refresh logic

## Blocked by

[001 — Extension scaffold + login flow](./001-extension-scaffold-login.md) — the service worker and token store must exist first.
