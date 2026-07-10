# PRD: Chrome Extension Boilerplate

**Status:** Ready for implementation  
**Date:** 2026-07-10  
**Labels:** `ready-for-agent`

---

## Problem Statement

A developer using this SaaS boilerplate gets a web app and an API out of the box. If they want to ship a Chrome extension (for quick-access tools, background sync, or browser-integrated features), they currently have to scaffold it from scratch — setting up auth token storage, CORS handling, manifest wiring, and build tooling on their own. The extension code has no shared auth service with the web app, so token handling inevitably drifts. Every developer solves the same problems independently.

## Solution

This project adds a Chrome Extension app (`apps/extension/`) to the monorepo, built with WXT, React 19, and Tailwind v4 — the same UI stack as the web app. The extension comes with login/register, token persistence via `chrome.storage.logcal`, and a service worker that owns all API communication. The web app's `AuthService` class, Zod schemas, and utility functions are extracted into a new shared workspace (`packages/shared/`) so both clients use identical auth logic. The extension includes three entry points: a popup (login ↔ authenticated dashboard), an options page (full-height sidebar with Profile, Organization, Billing, Logout), and a service worker (token refresh, message relay). Billing is delegated to the web app — the extension links to the web app's billing page instead of duplicating checkout UI.

## Market Context

- **Persona:** A developer building a SaaS who needs a Chrome extension that authenticates against the same backend as their web app.
- **Plan tier:** Not directly tied to any plan. This is a boilerplate differentiator for acquisition.
- **Impact:** Removes the auth/API/CORS integration tax for extension development. A developer can `npm run dev` and have a working extension connected to their API within minutes.
- **Out of scope for this version:** Content scripts, side panel, DevTools panel, or use-case-specific extension features. This is a foundational boilerplate — not a finished product.

## User Stories

### Authentication

1. As a new user, I want to register an account from the extension popup, so that I can start using the extension without visiting the web app.
2. As a returning user, I want to log in from the extension popup with my email and password, so that I can access my data.
3. As a user with MFA enabled, I want to complete a TOTP challenge during login, so that my account stays secure.
4. As a user, I want to see inline validation errors (invalid email, wrong password, account inactive) in the popup form, so that I know what to fix.
5. As a user, I want the extension to stay logged in across browser sessions, so that I don't re-enter credentials every time.
6. As a user, I want to log out from the popup, so that I can switch accounts or secure my session.
7. As a user who forgot their password, I want the popup to link to the web app's password reset page, so that I can regain access.

### Authenticated State

8. As a logged-in user, I want the popup to show my name, email, and current organization, so that I can confirm which account is active.
9. As a user with multiple Organizations, I want to switch my active organization from the popup, so that I can access the correct context.
10. As a user, I want the popup to recover gracefully if the API is unreachable (show error banner with retry), so that I'm not left staring at a blank or loading view.

### Options Page

11. As a user, I want to open the extension's options page and see a full-height sidebar with navigation sections, so that I can manage my settings.
12. As a user, I want the options page sidebar to include a Profile section (name, email, avatar), so that I can update my personal information.
13. As a user, I want the options page to include an Organization section showing my current plan, member count, and a link to the web app's org settings, so that I can manage team settings.
14. As a user, I want a Billing link in the options page that opens the web app's billing management page in a new tab, so that I can upgrade my plan or view invoices.
15. As a user, I want a Logout button in the options page sidebar, so that I can sign out of the extension.

### Token Lifecycle

16. As a user with a valid refresh token, I want the service worker to silently refresh my access token when it expires, so that I stay authenticated without interruption.
17. As a user whose refresh token has expired, I want to be silently logged out and shown the login form on the next popup open, so that I'm not stuck with stale credentials.

### Zero State / First Install

18. As a user who installed the extension and has an existing web app account, I want to log in from the popup without re-registering, so that I can use the same credentials.
19. As a user who installed the extension and does not have an account, I want to see a registration form or a link to the web app signup page, so that I can create an account.

## Implementation Decisions

### Modules

#### 1. `packages/shared/` — New workspace (deep)

Extracted from the current web app's `src/lib/auth/`, `src/schemas/`, `src/lib/utils.ts`, `src/lib/config.ts` (constants only, not web-specific ENV/ROUTES).

**Public interface:**
```
@resumio/shared
├── AuthService (class)
│   ├── constructor(api: FetchClient, tokenStore: TokenStore)
│   ├── login(data) → TokenPair | MfaPendingResponse
│   ├── register(data) → SignupResponse
│   ├── refresh(data) → TokenPair
│   ├── logout()
│   ├── verifyEmail(data) → UserResponse
│   ├── forgotPassword(data) → void
│   ├── resetPassword(data) → UserResponse
│   ├── getMe() → UserResponse
│   ├── refreshIfNeeded() → TokenPair | null
│   └── isAuthenticated() → boolean
├── TokenStore (interface)
│   ├── getAccess() → string | null
│   ├── getRefresh() → string | null
│   ├── set(access, refresh) → void
│   └── clear() → void
├── snakeCaseSchema(schema) → z.ZodType (utility)
├── extractApiError(err) → AuthError (utility)
├── schemas/ (Zod 4 — TokenPairSchema, UserResponseSchema, etc.)
├── constants/
│   ├── API_ENDPOINTS
│   ├── STORAGE_KEYS
│   └── PROJECT (shared config)
└── types/ (TypeScript interfaces)
```

**Deep?** Yes. Clients import from `@resumio/shared` and only need to provide a `TokenStore` implementation and an HTTP client. No knowledge of the other client's storage or routing.

#### 2. `apps/extension/` — New WXT app

Three contexts, one `packages/shared/` dependency.

**Service Worker (deep):**
- Message interface:
  ```typescript
  type ExtensionMessage =
    | { type: 'LOGIN'; payload: LoginRequest }
    | { type: 'REGISTER'; payload: RegisterRequest }
    | { type: 'REFRESH' }
    | { type: 'LOGOUT' }
    | { type: 'GET_ME' }
    | { type: 'API_REQUEST'; payload: { method: string; path: string; body?: unknown } };
  ```
- Uses `chrome.storage.local` – based `TokenStore`
- Registers `alarms` for periodic token refresh
- Uses `fetch` (not Axios) — no Axios dependency in the extension

**Popup (shallow):**
- States: loading → login/register form → authenticated view → error
- All data via `chrome.runtime.sendMessage` to service worker
- React 19 + Tailwind v4 + shadcn/ui components
- No direct API calls. No token awareness.

**Options Page (shallow):**
- Full-height sidebar (same pattern as web dashboard)
- Sections: Profile, Organization, Billing (external link), Logout
- Same service worker message pattern as popup

#### 3. `apps/web/` — Modified

- Replace `src/lib/auth/auth-service.ts`, `src/lib/errors.ts`, `src/lib/utils.ts` (snakeCaseSchema), `src/schemas/`, `src/lib/config.ts` (API_ENDPOINTS, STORAGE_KEYS, PROJECT) with imports from `@resumio/shared`
- Keep: `src/lib/api.ts` (Axios instance), `src/lib/config.ts` (ENV, ROUTES — web-specific), web `tokenStore` (localStorage + cookie)
- Update barrel exports

#### 4. `apps/api/` — Minimum change

- Add `chrome-extension://*` to `CORS_DEV_ORIGINS` in `main.py` (low priority — service worker bypasses CORS)

#### 5. Root config — Modified

- `turbo.json`: add `extension`, `extension:dev`, `extension:lint`, `extension:test`, `shared:build` tasks
- `package.json`: workspaces include `packages/*`, add root scripts for extension
- Root `biome.json`: no changes needed (already covers all JS/TS)

### API Contracts

- No new API endpoints. The extension uses the same `POST /api/v1/auth/*`, `GET /api/v1/users/me`, etc.
- API already supports Bearer token auth — no change needed.
- Snake_case JSON already returned — no change needed.

### Danger Zones

- **Multi-tenancy:** No changes. The existing organization-id-in-path pattern works from any client.
- **Billing:** Delegated to web app. The extension links to the web app's billing page.
- **Permissions:** No changes. RBAC is enforced server-side, same as web.
- **Audit logging:** No changes. Audit events are created server-side.

### ADR References

- ADR 0001 covers: WXT choice (Decision 1), service worker API proxy (Decision 2), shared workspace (Decision 3), options page layout (Decision 4).

## Testing Decisions

- **What makes a good test:** Observable behaviour through public interfaces. For the service worker: send a message, assert the response. For the token store: store a token, close and reopen, assert it persists. No mocking of internal collaborators.
- **Modules with tests:**
  - `packages/shared/` — `AuthService` unit tests (test with a mock HTTP client and a mock `TokenStore`). Follow the pattern of `apps/api/tests/` (pytest async, httpx) — but in Vitest with MSW or similar for HTTP mocking.
  - `apps/extension/` — Service worker message handler tests (Vitest), token store tests (Vitest with `chrome.storage` mock from `vitest-chrome` or WXT's test utils). Popup component tests for login form validation (React Testing Library).
  - `apps/web/` — No tests added. The web app has no test framework and this PRD does not add one.
- **Prior art:** `apps/api/tests/conftest.py` uses in-memory SQLite, overrides dependencies, and tests through the HTTP interface. The extension tests should follow the same philosophy: test through the message interface, mock only the browser extension APIs.

## Out of Scope

- Content scripts, side panel, DevTools panel — added by extension users for their use case
- OAuth login (Google/GitHub) from within the extension — the web app handles OAuth, the extension links to it
- Real-time notifications or push messaging — the API supports notifications, but the extension service worker doesn't implement push yet
- Offline mode or queueing — the extension assumes network connectivity
- Visual design beyond the sidebar layout and login form — use existing shadcn/ui components
- The extension is not published to the Chrome Web Store as part of this PRD

## Open Questions

- Should `packages/shared/` have its own build step (TypeScript compilation) or should it be consumed as raw TS by Turbo's build graph? (Turbo handles transpilation of workspace dependencies, so raw TS should work.)
- What is the exact shadcn/ui component set the popup should use? (Match the web app's current set — button, card, input, form, dialog, sidebar.)
- Does the service worker need an `alarms` listener for periodic token refresh, or should it refresh on-demand when the popup opens? (Recommended: on-demand + alarms as fallback to prevent the service worker from staying warm unnecessarily.)
