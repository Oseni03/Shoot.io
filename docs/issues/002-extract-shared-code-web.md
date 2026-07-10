---
labels: ready-for-agent
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

The web app currently has inline copies of `AuthService`, Zod schemas, `snakeCaseSchema()`, `extractApiError()`, and shared constants (`API_ENDPOINTS`, `STORAGE_KEYS`, `PROJECT`). Replace those with imports from `@resumio/shared`.

This is a refactoring slice — no user-facing changes. After this slice, the web app's auth and API layers are identical in behaviour but sourced from the shared workspace. This proves the `packages/shared/` interface is correct for both clients.

Specifically:
- `apps/web/src/lib/auth/auth-service.ts` → import `AuthService` from `@resumio/shared`
- `apps/web/src/lib/auth/types.ts` (the `TokenStore` interface) → import from `@resumio/shared`
- `apps/web/src/lib/auth/errors.ts` → import `extractApiError` and `AuthError` hierarchy from `@resumio/shared`
- `apps/web/src/lib/utils.ts` (the `snakeCaseSchema` portion) → import from `@resumio/shared`
- `apps/web/src/schemas/` → import all Zod schemas from `@resumio/shared`
- `apps/web/src/lib/config.ts` (the `API_ENDPOINTS`, `STORAGE_KEYS`, `PROJECT` portions) → import from `@resumio/shared`

What stays in `apps/web/src/lib/config.ts`: `ENV`, `ROUTES`, `DEFAULTS`, `NAV_LINKS`, `QUERY_KEYS` — these are web-specific.
What stays in `apps/web/src/lib/api.ts`: the Axios instance, request/response interceptors, and the web's `tokenStore` (localStorage + cookie) — these are web-specific.

## Risk

`Normal` — no database, no billing, no migrations. This is a pure import-path refactoring. If shared schemas are missing something, the TypeScript compiler catches it.

## Acceptance criteria

- [ ] `npm run build` passes for `apps/web/` (Next.js build)
- [ ] `npm run lint` passes for `apps/web/` (Biome check)
- [ ] `npx tsc --noEmit` passes for `apps/web/`
- [ ] Login, register, password reset, and all authenticated pages in the web app work identically to before (manual smoke test)
- [ ] No remaining imports from the old inline locations (verify with grep)

## Blocked by

[001 — Extension scaffold + login flow](./001-extension-scaffold-login.md) — `packages/shared/` must exist first.
