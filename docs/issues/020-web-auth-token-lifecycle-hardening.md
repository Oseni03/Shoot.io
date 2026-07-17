---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

Two related issues in `apps/web/src/lib/api.ts`'s token handling:

1. **Unnecessary exposure surface.** `tokenStore.set()` writes access/refresh tokens to `localStorage` *and* mirrors them into a non-`httpOnly` `document.cookie`, purely so `middleware.ts` can check token presence for route-guarding. Both storage locations are equally readable by any XSS on the page — the cookie mirror doesn't add security, it just doubles the places a token leak can be read from. Replace the presence check `middleware.ts` does with something that doesn't require a JS-readable cookie (e.g. check for a specific non-sensitive "logged in" boolean cookie instead of the token itself, or move the guard client-side into `organization-guard.tsx`'s existing auth-check path).
2. **401 handling discards work instead of refreshing.** The response interceptor in `lib/api.ts` clears tokens and hard-redirects to `/login` on any 401, even though `useRefreshToken()` (`hooks/useAuth.ts`) already exists and does the correct refresh-token exchange — it's just never wired into this interceptor. A routine access-token expiry mid-session (e.g. during the resume editor's debounced autosave) currently logs the user out and drops unsaved edits. Wire the interceptor to attempt one refresh-and-retry on a 401 before falling back to clearing tokens and redirecting.

## Risk

`Security`, `Normal` — no backend changes required (the refresh endpoint already exists and is used elsewhere). Touches the global API client, so this affects every authenticated request in the web app; test broadly, not just the resume editor path.

## Acceptance criteria

- [ ] Tokens are no longer written to `document.cookie`; `middleware.ts`'s route guard still correctly redirects unauthenticated users to `/login`
- [ ] A request that gets a 401 due to an expired access token triggers exactly one silent refresh-and-retry via `useRefreshToken()`'s underlying call, and succeeds without the user noticing
- [ ] A request that gets a 401 where the refresh *also* fails (expired/invalid refresh token) clears tokens and redirects to `/login`, same as today
- [ ] The resume editor's debounced autosave, mid-edit, survives a simulated access-token expiry without losing the in-flight edit
- [ ] `npm run lint` and any existing web tests pass

## Blocked by

None — can start immediately.
