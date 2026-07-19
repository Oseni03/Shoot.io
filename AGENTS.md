npm workspaces monorepo (`apps/*`, `packages/*`), Turbo for task orchestration.

## Apps

| App | Path | Stack | Port |
| --- | ---- | ----- | ---- |
| API | `apps/api/` | FastAPI + SQLAlchemy async + Alembic + uv | 8000 |
| Web | `apps/web/` | Next.js 16 App Router + Tailwind v4 + Biome | 3000 |
| Extension | `apps/extension/` | React 19 + Tailwind v4 + WXT | — |
| Shared | `packages/shared/` | AuthService, Zod schemas, utils | — |

## Commands

```bash
npm run dev        # turbo run dev — API, web, extension
npm run lint       # turbo run lint — lints all apps
npm run test       # turbo run test — tests all apps
npm run build      # turbo run build (slow — avoid in dev)
```

> **NEVER run `npm run build` or any `build` script.** Build commands are slow, expensive, and unnecessary during development. Rely on `npm run dev` (HMR/watch mode) and `npx tsc --noEmit` for type checking.

### API (apps/api/)

```bash
npm run dev                # uv run uvicorn main:app --reload
make test                  # pytest -v --cov=app --cov-report=term-missing
make check                 # ruff check app tests + mypy app
make lint / make format    # ruff check / ruff format
make db-migrate            # alembic upgrade head
make db-revision msg="x"   # alembic revision --autogenerate -m "x"
```

Python deps via `uv pip install -r requirements.txt` (no pyproject.toml).
Test DB is in-memory SQLite (`aiosqlite://`) — no external services needed.
Full Makefile at `apps/api/Makefile` (49 lines).

### Web (apps/web/)

```bash
npm run dev        # next dev
npm run lint       # biome check (includes organize-imports)
npm run format     # biome format --write
npx tsc --noEmit   # typecheck
```

No test framework installed. Biome (not ESLint). Tailwind v4 (`@import "tailwindcss"`, no `tailwind.config.js`).

### Extension (apps/extension/)

```bash
npm run dev        # wxt dev (HMR, loads in Chrome as unpacked)
npm run lint       # biome check
npm run test       # vitest run (40+ tests)
npx tsc --noEmit   # typecheck
```

Built with WXT (Web Extension Tools). Popup + Options page + Service Worker.
Service worker owns all API calls (bypasses CORS); popup/options communicate via `chrome.runtime.sendMessage`.
Tested with Vitest + jsdom + React Testing Library (popup login form tests).

### Shared (packages/shared/)

Contains `AuthService` class, `TokenStore` interface, Zod schemas, `snakeCaseSchema()` utility, config constants, and error class hierarchy. Framework-independent — no React/Next.js deps. No build step — consumers import TS source directly.

## Setup

1. `npm install` at root
2. `apps/api`: copy `.env.example` → `.env`, fill secrets
3. Start infra: `docker compose up -d` from `apps/api/` (Postgres + Redis)
4. Run migrations: `alembic upgrade head` from `apps/api/`
5. `npm run dev` at root

Web has no `.env.example` — expected vars: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`), `NEXT_PUBLIC_FRONTEND_URL`. Root `.env.example` has shared vars.

Extension: copy `apps/extension/.env.example` → `apps/extension/.env`, set `VITE_API_URL` (default `http://localhost:8000/api/v1`). Load in Chrome as unpacked extension from `.output/chrome-mv3/` after `npm run dev`.

## Architecture

- API: layered (endpoints → services → repositories → SQLAlchemy models), ULID PKs, async throughout
- Web: `src/app/` route groups, feature components mirrored in `src/components/`, all env vars through `src/lib/config.ts`
- API returns snake_case JSON; web's `snakeCaseSchema()` validates that shape
- Web auth: custom JWT (access_token in localStorage + cookie, refresh_token in localStorage only), no auto-refresh on 401 — call `authService.refreshIfNeeded()` proactively
- Extension auth: same AuthService class from `packages/shared/`, but tokens stored in `chrome.storage.local`. Service worker owns all API calls to bypass CORS. Token refresh via 15-min `chrome.alarms` with concurrency guard.

## Context files

| File | Status |
| ---- | ------ |
| `apps/web/AGENTS.md` | Filled — frontend architecture, conventions, API contract rules |
| `apps/api/CONTEXT.md` | Filled — domain glossary (User, Organization, MemberRole, PlanTier) |
| `apps/api/README.md` | Filled — full backend docs (180 lines) |
| `apps/extension/CONTEXT.md` | Filled — extension architecture, message types, testing |
| `apps/extension/README.md` | Filled — extension dev workflow, loading, architecture |
| `packages/shared/CONTEXT.md` | Filled — shared exports, constraints |
| `CONTEXT.md` (root) | Filled — stack, invariants, patterns |
| `DOMAIN.md` (root) | Filled — domain glossary |
| `docs/adr/0001-chrome-extension-architecture.md` | Filled — WXT choice, service worker API proxy, shared workspace |

## Issues

Tracked in `docs/issues/`. One file per slice (TDD tracer bullet). Status in frontmatter `labels:` field.

| # | Title | Status |
|---|-------|--------|
| 001 | Extension scaffold + login flow | ✅ implemented |
| 002 | Extract shared code from web app | ✅ implemented |
| 003 | Extension registration, MFA, error states | ✅ implemented |
| 004 | Extension options page | ✅ implemented |
| 005 | Extension token refresh (alarms) | ✅ implemented |
| 006 | Extension polish, CI, tests, docs | ✅ implemented |
| 007 | Shoot — one-click resume tailoring (meta) | ✅ implemented |
| 008 | Plan tiers + shot tracking | ✅ implemented |
| 009 | Resume CRUD + master invariant | ✅ implemented |
| 010 | Three-column resume editor | ✅ implemented |
| 011 | TailoringService AI integration | ✅ implemented |
| 012 | Shoot endpoint + extension SW handler | ✅ implemented |
| 013 | Indeed content script | ✅ implemented |
| 014 | Shots remaining UI (popup + toolbar) | ✅ implemented |
| 015 | MFA code in body, not query param | ✅ implemented |
| 016 | Org membership checks on billing/org endpoints | ✅ implemented |
| 017 | Resume update partial section data-loss fix | ✅ implemented |
| 018 | Autofill false match on unnamed inputs | ✅ implemented |
| 019 | Shot limit atomic check and increment | ✅ implemented |
| 020 | Web auth token lifecycle hardening | ✅ implemented |
| 021 | Deterministic multi-org plan resolution | ✅ implemented |
| 022 | Master resume toggle UI/backend mismatch | 🔶 partial — no manual browser verification done (apps/web has no test framework) |
| 023 | Autosave flush on navigation | 🔶 partial — no manual browser verification done (apps/web has no test framework) |
| 024 | Shoot button disabled until master check resolves | ✅ implemented |
| 025 | Billing webhook unrecognized plan code handling | ✅ implemented |
| 026 | Tailoring AI response validation | ✅ implemented |
| 027 | Member management error toasts | 🔶 partial — no manual browser verification done (apps/web has no test framework) |
| 028 | Shared PlanTier ULTIMATE enum | ✅ implemented |
| 029 | Extension 402 shot-limit toast | ✅ implemented |
