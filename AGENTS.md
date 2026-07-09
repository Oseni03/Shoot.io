# AGENTS.md — resumio

npm workspaces monorepo (`apps/*`), Turbo for task orchestration.

## Apps

| App | Path | Stack | Port |
| --- | ---- | ----- | ---- |
| API | `apps/api/` | FastAPI + SQLAlchemy async + Alembic + uv | 8000 |
| Web | `apps/web/` | Next.js 16 App Router + Tailwind v4 + Biome | 3000 |

## Commands

```bash
npm run dev        # turbo run dev — both apps
npm run build      # turbo run build
npm run lint       # turbo run lint
```

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
npm run build      # next build (output: standalone)
npm run lint       # biome check (includes organize-imports)
npm run format     # biome format --write
npx tsc --noEmit   # typecheck (no npm script)
```

No test framework installed. Biome (not ESLint). Tailwind v4 (`@import "tailwindcss"`, no `tailwind.config.js`).

## Setup

1. `npm install` at root
2. `apps/api`: copy `.env.example` → `.env`, fill secrets
3. Start infra: `docker compose up -d` from `apps/api/` (Postgres + Redis)
4. Run migrations: `alembic upgrade head` from `apps/api/`
5. `npm run dev` at root

Web has no `.env.example` — expected vars: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`), `NEXT_PUBLIC_FRONTEND_URL`. Root `.env.example` has shared vars.

## Architecture

- API: layered (endpoints → services → repositories → SQLAlchemy models), ULID PKs, async throughout
- Web: `src/app/` route groups, feature components mirrored in `src/components/`, all env vars through `src/lib/config.ts`
- API returns snake_case JSON; web's `snakeCaseSchema()` validates that shape
- Web auth: custom JWT (access_token in localStorage + cookie, refresh_token in localStorage only), no auto-refresh on 401 — call `authService.refreshIfNeeded()` proactively

## Context files

| File | Status |
| ---- | ------ |
| `apps/web/AGENTS.md` | Filled — frontend architecture, conventions, API contract rules |
| `apps/api/CONTEXT.md` | Filled — domain glossary (User, Organization, MemberRole, PlanTier) |
| `apps/api/README.md` | Filled — full backend docs (180 lines) |
| `apps/web/API.md` | Filled — endpoint contract doc |
| `CONTEXT.md` (root) | **Template** — not populated yet |
| `DOMAIN.md` (root) | **Template** — not populated yet |
