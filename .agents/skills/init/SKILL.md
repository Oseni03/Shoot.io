---
name: init
description: Bootstrap AGENTS.md, CONTEXT.md, and DOMAIN.md by scanning the project's codebase and database schema. Use on a freshly scaffolded project, when migrating an existing project into this monorepo layout, or when context files have drifted far enough from reality that incremental updates won't fix them.
---

# Init

The three context files (`AGENTS.md`, `CONTEXT.md`, `DOMAIN.md`) are the source of truth for every agent working on this codebase. This skill generates or regenerates them by inspecting the actual codebase and database schema — not from guesswork or stale memory.

Run this once on a fresh scaffold, or whenever the context files have degraded beyond repair.

---

## Process

### 1. Discover the stack

Walk the project to determine what's actually installed and configured.

**Root level:**
- `package.json` — workspaces, scripts, turbo config
- `turbo.json` — task orchestration
- `docker-compose.yml` — services

**Backend layer (`apps/api/`):**
- `package.json` — Express? Other Node backend?
- `pyproject.toml` / `requirements.txt` / `Pipfile` — FastAPI? Django? Other Python backend?
- `prisma/schema.prisma` — Prisma ORM for Node backends
- `*/models.py` / `*/schema.py` — Django/SQLAlchemy models
- `Dockerfile` — runtime config
- Test config — Vitest? Pytest? Unittest?
- Source layout — controllers, routes, services, middleware

**Frontend layer (`apps/web/`):**
- `package.json` — Next.js version, other dependencies
- `next.config.*` — app configuration
- `src/app/` — App Router layout
- `src/app/api/` — API routes if any
- Test config — Vitest? Jest? Playwright?

Record the actual versions and tools — not what the template claims.

### 2. Extract the database schema

Find and parse the authoritative schema definition:

**Prisma ORM:**
Look for `apps/api/prisma/schema.prisma`. Extract:
- Model names and fields (name, type, attributes)
- Enums
- Relations (one-to-many, many-to-many)
- Unique constraints and indexes
- Field-level attributes (@default, @updatedAt, etc.)

**SQLAlchemy / Django ORM:**
Look for model definitions in `apps/api/*/models.py` or `apps/api/**/models.py`. Extract the same information.

If multiple schema files exist, read all of them.

### 3. Build DOMAIN.md

From the extracted database schema, construct a `DOMAIN.md`:

**Core Entities:** One entry per database model/table. For each:
- **Name** — the model name as the canonical domain term (use the singular, PascalCase form)
- **What it is** — one sentence from the user's perspective
- **Relationships** — Belongs to / Has many based on schema relations
- **Invariants** — unique constraints, non-null fields, business rules visible from the schema
- **Agent note** — practical guidance (e.g. "Always eager-load the related X when querying Y")

**Key Operations (Verbs):** Scan the codebase for controller/service function names that match common CRUD patterns (`create*`, `update*`, `delete*`, `get*`, `list*`, `publish*`, `archive*`). Add the top 5-10 verbs with domain meaning and example usage.

**Glossary:** Add any technical terms specific to the project that could be misread.

If `DOMAIN.md` already exists, overwrite it with the regenerated version (the user called init — they want a fresh start).

### 4. Build CONTEXT.md

From the discovered stack and schema, construct a `CONTEXT.md`:

**Stack table:** Populate each row with the actual technology choices:

| Layer    | Technology                   | Notes                                                       |
| -------- | ---------------------------- | ----------------------------------------------------------- |
| Frontend | Next.js `<version>` App Router | `<any ordering/routing conventions>`                         |
| API      | `<framework> <version>`      | `<route organisation, error format>`                        |
| Database | `<db type> + <ORM>`          | `<convention — snake_case, plural table names, etc>`        |
| Auth     | `<auth library>`             | `<session shape, how to access current user>`               |
| Testing  | `<test framework>`           | `<where tests live, run command>`                           |
| CI       | `<CI tool>`                  | `<what must pass before merge>`                             |

**Invariants:** Add rules inferred from the schema and codebase:
- Multi-tenancy — if a `workspace_id` or `tenant_id` exists on models
- Auth — cookie vs token, refresh flow
- Billing — if Stripe/subscription models exist
- Audit — if `created_at`/`updated_at` conventions exist

**Patterns:** Note conventions found in the codebase:
- API response shape — error format, envelope
- Error handling — thrown exceptions, try/catch, Result types
- Module structure — where business logic vs route handlers live
- Testing conventions — integration vs unit, test database setup
- Feature flags — if present

**Deprecated:** Leave the section header but mark as empty if nothing is deprecated.

If `CONTEXT.md` already exists, overwrite it with the regenerated version.

### 5. Build AGENTS.md

From the discovered stack and codebase, construct `AGENTS.md`:

**Project title:** Use the project name from root `package.json`.

**Apps section:** List each app with its role, framework, and port.

**Commands:** Verify the actual scripts in root `package.json` — don't guess.

**Local Setup:** Derive from:
- Docker Compose services in `apps/api/docker-compose.yml` (if any)
- Database setup steps (prisma migrate, alembic, manage.py migrate)
- Env file conventions
- Seed commands

**Key Facts:** Add everything an agent needs to know that isn't obvious:
- API base URL, auth method
- Any non-standard conventions (snake_case JSON, custom Prisma output dir)
- Per-app path aliases
- Test commands for each app
- CI status
- Docker Compose locations

**Per-app docs:** Reference any `AGENTS.md` files found in sub-apps.

If `AGENTS.md` already exists, overwrite it with the regenerated version.

### 6. Present the diff

Show the user what changed. For each file:
- **Files updated:** `<path>`
- **Key changes:** 2-3 bullet points of what was discovered
- **Uncertainties:** Any guesses or assumptions made (e.g. "Assumed `workspace_id` means multi-tenancy — verify this")

Ask the user: "Does this look right? Any corrections before I commit?"

### 7. Commit

```bash
git add AGENTS.md CONTEXT.md DOMAIN.md
git commit -m "init: bootstrap context files from codebase and schema"
```
