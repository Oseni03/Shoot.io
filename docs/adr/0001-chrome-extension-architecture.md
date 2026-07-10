# ADR 0001: Chrome Extension Architecture

**Status:** Accepted  
**Date:** 2026-07-10  
**Context:** Adding a Chrome Extension app to the resumio monorepo as a boilerplate component.

## Decision 1: WXT over Plasmo

**Decision:** Use WXT (Web Extension Tools) for the extension build system.

**Alternatives considered:**
- **Plasmo** — heavier framework with its own opinionated structure, harder to integrate with existing Turbo monorepo
- **Vanilla Webpack/Vite** — more flexible but requires manually wiring up manifest generation, HMR, and type definitions that WXT provides out of the box

**Trade-offs:**
- WXT is lighter weight and composes better with Turbo's task graph
- WXT uses Vite under the hood, matching the same ecosystem as the web app
- WXT's `.output/` directory is a known output path for Turbo caching

## Decision 2: Service Worker as API Proxy

**Decision:** All API calls from the extension route through the service worker (background script), not directly from the popup. The popup communicates with the service worker via `chrome.runtime.sendMessage`.

**Alternatives considered:**
- **Direct fetch from popup** — simpler architecture, but requires `chrome-extension://<id>` in the API's CORS allowlist. The extension ID is non-deterministic in development and changes between environments, making this fragile.

**Trade-offs:**
- Service worker context bypasses CORS entirely (privileged fetch)
- Centralizes token lifecycle in one place (service worker owns token refresh, popup/options are stateless consumers)
- Adds message-passing indirection (popup → service worker → API → service worker → popup)

## Decision 3: Shared Workspace (`packages/shared/`)

**Decision:** Extract framework-independent code into `packages/shared/` workspace under the npm workspaces root.

**Contents:**
- `AuthService` class (login, register, refresh, logout)
- `TokenStore` interface
- Zod schemas for API request/response shapes
- `snakeCaseSchema()` utility
- API endpoint constants
- Shared TypeScript types

**Alternatives considered:**
- **Code duplication** — simpler initially but guarantees drift between web and extension auth logic
- **Direct import from `apps/web`** — ties the extension to Next.js internals and barrel exports, creates fragile coupling

**Trade-offs:**
- Adds one more workspace package to manage
- The shared boundary must be disciplined (no React, no Next.js, no `window`)

## Decision 4: Options Page Layout

**Decision:** The options page uses a full-height sidebar navigation layout. The sidebar spans the entire viewport height with navigation items (Profile, Organization, Billing, etc.). Content area sits adjacent to the sidebar.

**Alternatives considered:**
- **Top navigation bar** — less suitable for the number of settings sections an options page needs
- **Tabbed layout** — tabs compress poorly when the options page is resized or viewed in a narrow window

**Trade-offs:**
- Full-height sidebar matches the web app's dashboard layout pattern (consistency for developers moving between web and extension)
- Sidebar accommodates growing number of settings sections without reflow
- Chrome's own options pages (e.g., chrome://settings) use a sidebar pattern — familiar to users

## Consequences

1. The extension requires `apps/extension/.env` with `VITE_API_URL` baked at build time
2. The service worker must handle message types: `LOGIN`, `REGISTER`, `REFRESH`, `LOGOUT`, `GET_ME`, `API_REQUEST`
3. The popup becomes a thin UI layer — all business logic lives in the service worker
4. Host permissions are scoped to `VITE_API_URL` in development, configurable for production
5. Tests (Vitest) cover the service worker message handlers and token store
6. The options page renders a full-height sidebar (matching web dashboard) with nav items for Profile, Organization, Billing link, and Logout
