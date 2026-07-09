# CONTEXT.md

Living codebase context. Read at the start of every agent session. Updated via `/improve-skill` after every 3–5 shipped features.

An agent that reads this file before writing any code will make decisions that fit the codebase. An agent that skips it will invent patterns, break conventions, and create debt that costs more to fix than it cost to build.

---

## Stack

Fill in your actual technologies. Be specific — "Postgres" is less useful to an agent than "Postgres 16 via Drizzle ORM, snake_case column names, migrations in `db/migrations/`".

| Layer    | Technology                         | Notes                                                       |
| -------- | ---------------------------------- | ----------------------------------------------------------- |
| Frontend | `<e.g. Next.js 14 App Router>`     | `<any constraints or conventions>`                          |
| API      | `<e.g. tRPC v11>`                  | `<how routes are organised, how errors are returned>`       |
| Database | `<e.g. Postgres 16 + Drizzle ORM>` | `<migration tool, naming conventions, where schema lives>`  |
| Auth     | `<e.g. Better Auth>`               | `<session shape, how to access current user and workspace>` |
| Billing  | `<e.g. Stripe>`                    | `<webhook handler location, event log table name>`          |
| Testing  | `<e.g. Vitest + Supertest>`        | `<where tests live, how to run them, test DB setup>`        |
| CI       | `<e.g. GitHub Actions>`            | `<what must pass before a PR can merge>`                    |

---

## Invariants

Rules agents must never violate. Non-negotiable across every feature, every slice, every PR.

### Multi-tenancy

- Every database query against user-owned data must include a `workspace_id` filter
- The workspace is resolved from the authenticated session — never from a request parameter
- Row-level security is enforced at `<where — DB policy / service layer / middleware>`
- If you write a query against a user-owned table without a `workspace_id` filter, stop and raise a HITL checkpoint

### Billing

- Billing events are written to `<table name>` and are **append-only** — never update or delete
- Plan limits are enforced at `<where — middleware / service layer>`
- Current plan is accessed via `<how — e.g. session.workspace.plan>`
- Billing-adjacent changes ship behind a feature flag, off by default

### Permissions

- Access control is `<declarative — policy files at <path> / imperative — can() checks>`
- Permission checks are never bypassed — not in test helpers, not in seed scripts, not in one-off scripts
- `<Any other permission rules specific to your system>`

### Audit log

- `<Which entities / operations are audit-logged>`
- Audit entries are append-only — never update or delete
- `<What fields every audit entry must include>`

---

## Patterns

Resolved conventions. When in doubt, follow these. When a new convention supersedes one here, update this file — don't leave stale patterns for agents to follow.

### API response shape

```ts
// All API responses use this envelope — no exceptions
type Success<T> = { data: T };
type Failure = { error: { code: string; message: string } };
```

### Error handling

`<How errors surface — thrown exceptions / Result types / error boundaries / etc. Be specific.>`

### Database access

`<Which ORM / query builder, naming conventions, how to run and write migrations>`

### Feature flags

- Risky changes ship behind `<how flags work — e.g. workspace.flags.featureName>`
- Flags default to `false` — opt-in, never opt-out
- `<How to add a new flag>`

### Module structure

`<Where business logic lives versus where route handlers / controllers live>`
`<How shared utilities are organised — e.g. lib/, utils/, services/>`

### Testing conventions

- Tests live in `<where — co-located / __tests__ / separate test/ directory>`
- Integration tests use `<test database setup — e.g. a real test DB seeded per test, or per suite>`
- No mocking of internal collaborators — test through public interfaces
- Test names use domain vocabulary from `DOMAIN.md`

---

## Deprecated

Patterns that have been replaced. Agents must not use these, even if they appear in older parts of the codebase.

| Deprecated              | Replaced by     | Since            |
| ----------------------- | --------------- | ---------------- |
| `<old pattern or file>` | `<new pattern>` | `<date or PR #>` |
