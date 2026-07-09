# CONTEXT.md

Living codebase context. Read at the start of every agent session.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 App Router + Tailwind v4 + Biome | `src/app/` route groups, no test framework, `output: "standalone"` |
| API | FastAPI 0.136 + SQLAlchemy 2.0 async + Pydantic v2 | Uvicorn, `app/api/v1/endpoints/` routes, `app/services/` |
| Database | Postgres 16 (asyncpg) + Alembic | Migrations in `app/db/migrations/`, snake_case columns, ULID PKs (26-char strings) |
| Auth | Custom JWT (python-jose HS256) + bcrypt | access_token (30min) + refresh_token (30d, Redis-blacklistable). OAuth: Google + GitHub. MFA: TOTP. |
| Billing | Paystack | `app/services/billing_service.py` — initialize, verify, cancel, webhooks (HMAC-SHA512) |
| Email | Resend | `app/lib/email.py` — verification, password reset, invitation, welcome. Falls back to stdout when no API key set. |
| Testing | pytest + pytest-asyncio + httpx | In-memory SQLite (`aiosqlite://`) — no services needed. Tests in `tests/`. |
| Observability | structlog (console in dev, JSON in prod) + Sentry | Request ID tracing via middleware |
| Rate Limiting | SlowAPI | Per-IP, configurable via `RATE_LIMIT_PER_MINUTE`, stricter for auth endpoints |
| Config | pydantic-settings loads `.env` + `ProjectConfig` dataclass | `app/config.py` — `Settings` (env vars) + `project` (hardcoded constants) |

## Invariants

### Multi-tenancy (Organization isolation)

- Organization is the tenant boundary. User-owned data belongs to an Organization via `Membership` (user ↔ org join, with role).
- Every sensitive query against user-owned data filters by `organization_id` — enforced at the service and repository layer.
- Cross-organization data access is never permitted. Permission checks verify membership + role before every action.
- The organization is resolved from the URL path (`org_id` param) and validated against the current user's memberships via `get_org_member()` dependency.

### Billing (Paystack)

- Plan limits are enforced at the service layer via `PlanLimits.for_plan()` in `app/core/permissions.py` — call `assert_member_limit()` or `assert_feature_available()` before resource creation.
- Billing webhooks are verified with HMAC-SHA512 signature (`PAYSTACK_WEBHOOK_SECRET`) before processing.
- `Subscription` records match a Paystack subscription_code. The `Organization.plan` field is the source of truth for current plan tier.
- Billing events (webhooks) are processed idempotently — update org plan + upsert subscription record.

### Permissions (RBAC)

- Role hierarchy: `VIEWER(0) < MEMBER(1) < ADMIN(2) < OWNER(3)` defined in `project.role_rank`.
- Checks performed via `MembershipPolicy.ensure_role()` (in service layer) or `require_org_role()` FastAPI dependency (in routes).
- Permission checks are never bypassed — not in test helpers, not in seed scripts.

### Audit log

- `AuditLog` records: `action` (dotted string like `org.member_invited`), `user_id`, `organization_id`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `meta` (JSON).
- Logged explicitly via `AuditLogService.log()` in route handlers. Append-only — never update or delete entries.

## Patterns

### Error handling

- Hierarchical exceptions in `app/core/exceptions.py`: `AppError(HTTPException)` → `NotFoundError` (404), `ConflictError` (409), `ForbiddenError` (403), `UnauthorizedError` (401), `BadRequestError` (400), `UnprocessableError` (422), `PaymentRequiredError` (402).
- All handlers raise these custom exceptions; FastAPI returns them as JSON `{"detail": "..."}`.
- Global handler in `main.py` catches unhandled exceptions → 500 `{"detail": "An unexpected error occurred."}` + structlog exception log.

### Database access

- Repository pattern: `app/repositories/*_repo.py` classes wrap SQLAlchemy queries.
- Sessions created by `get_db()` dependency (commit on success, rollback on exception).
- ULID primary keys via `app/lib/ulid.py` (`new_ulid()` → 26-char sortable string).
- Tests use `sqlite+aiosqlite:///:memory:` — override `TEST_DATABASE_URL` for Postgres if needed.

### Module structure

```
main.py                         # FastAPI app factory (create_app)
app/
  api/v1/endpoints/             # Thin route handlers — parse input, call service, return response
  services/                     # Business logic — framework-agnostic (no FastAPI imports)
  repositories/                 # DB access layer — SQLAlchemy queries
  models/                       # SQLAlchemy ORM models (user, organization, membership, invitation, subscription, notification, audit_log)
  schemas/                      # Pydantic request/response models
  core/                         # Security, exceptions, permissions
  db/                           # Session, base (DeclarativeBase + TimestampMixin), migrations
  lib/                          # ULID, email, logger, pagination, redis
```

### Testing conventions

- Tests live in `tests/` matching `tests/api/` and `tests/services/`.
- Fixtures in `tests/conftest.py`: `setup_db` (autouse, create all tables per test), `db_session` (yields `AsyncSession`), `client` (httpx `AsyncClient` with overridden `get_db`).
- No mocking of DB — test against real SQLite in-memory. Mock external APIs (Resend, Paystack) at the HTTP layer.
- Factory Boy not yet used in test files but in dependencies.

### Pagination

- Offset-based via `PaginationParams` / `PaginationDep` dependency.
- Response shape: `PagedResponse[T]` — `{ items: T[], total: int, limit: int, offset: int, has_more: bool }`.

### Logging

- structlog throughout. In dev: colored console. In production: JSON.
- Request ID bound per-request via `request_id_middleware` (reads `X-Request-ID` header or generates UUID).
- All log calls are `logger.info("event_name", key=value)` style.

## Deprecated

Nothing deprecated yet.
