# Shared Package Context

Framework-independent TypeScript package providing shared code across the monorepo.

## What it provides

| Module | Exports | Used by |
|--------|---------|---------|
| `auth-service.ts` | `AuthService` class | Web, Extension |
| `token-store.ts` | `TokenStore` interface, `CallOptions` | Web, Extension |
| `schemas/` | Zod schemas (User, Org, Auth, etc.) + re-exports | Web, Extension |
| `config.ts` | `PROJECT`, `API_ENDPOINTS`, `STORAGE_KEYS` | Web, Extension |
| `errors.ts` | `AuthError` class hierarchy, `HttpClient` type | Web, Extension |
| `utils.ts` | `snakeCaseSchema()` transform | Web, Extension |

## Constraints

- No React, no Next.js, no `window`, no `chrome.*` — pure TypeScript + Zod only
- All packages import via `"shared"` workspace protocol (npm workspaces)
- Schemas are the single source of truth for API request/response shapes
- `PROJECT` config contains plan limits, password rules, role rank, token config
- `snakeCaseSchema()` is a `z.preprocess` that converts camelCase keys → snake_case before Zod validation

## Dev

No build step needed — consumers import TS source directly via workspace protocol.

```bash
new-item -itemtype file -path "packages/shared/README.md" -force
```

No lint/test scripts — covered by consumer apps' scripts.
