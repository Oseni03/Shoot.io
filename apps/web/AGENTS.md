# AGENTS.md

Next.js 16 App Router web app in the resumio monorepo. Source in `src/`.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | `next.config.ts`: `output: 'standalone'` |
| Styling | Tailwind CSS v4 + `tw-animate-css` | `@import "tailwindcss"` + `@tailwindcss/postcss` (NOT v3 directives) |
| Lint/Format | Biome 2 | `organizeImports` on save (`biome.json` line 33). Runs via gitignore. |
| Data fetching | TanStack React Query + Axios | Custom Axios instance `src/lib/api.ts` with token interceptors |
| Validation | Zod 4 | Schemas in `src/schemas/`; `snakeCaseSchema` transforms camelCase→snake_case on all API responses |
| UI | shadcn/ui New York + lucide-react | Components in `src/components/ui/`, CVA for variants |
| Auth | Custom JWT (class-based service) | `src/lib/auth/auth-service.ts` + `src/hooks/useAuth.ts`. NOT Better Auth. |
| Forms | react-hook-form + Zod resolver | |
| Animation | framer-motion + `tw-animate-css` | |
| Themes | next-themes + custom `ThemeProvider` | `src/contexts/theme-control.tsx` |
| Path alias | `@/*` → `./src/*` | |

## Commands (root)

```bash
npm run dev      # next dev, http://localhost:3000
npm run lint     # biome check (includes organize-imports)
npm run format   # biome format --write
npx tsc --noEmit # typecheck (no script configured)

> **NEVER run `npm run build` or any `build` script.** Build commands are slow, expensive, and unnecessary during development. Rely on `npm run dev` (HMR/watch mode) and `npx tsc --noEmit` for type checking.
```

No test framework installed.

## API Contract

`API.md` at project root documents every endpoint (request/response/errors). **Update API.md whenever API-related code changes** (schemas, api-services, auth service, or when endpoints change).

## Architecture

- **Pages**: `src/app/` — route groups: `(auth)/` (login, signup, forgot/reset-password, verify-email), `about/`, `privacy/`, `dashboard/`, `onboarding/`, `invitations/`
- **Feature components mirror routes**: `src/app/(auth)/` → `src/components/auth/`, `src/app/about/` → `src/components/about/`. Never colocate components inside route groups.
- **API layer**: Two parallel structures:
  - `src/lib/api-services/` — per-domain API call objects (org, billing, notification, mfa, admin, health, oauth)
  - `src/lib/auth/` — class-based auth/user service (login, register, refresh, me, change-password, profile)
  - Both use the same Axios instance (`src/lib/api.ts`)
- **Error handling**: Two utilities — `src/lib/error.ts` (simple `extractApiErrorMessage`), `src/lib/auth/errors.ts` (class hierarchy: `AuthError` → `AuthNetworkError` / `AuthValidationError` / `AuthSessionError`)
- **Config**: `src/lib/config.ts` — single source of truth (APP, ENV, ROUTES, API_ENDPOINTS, STORAGE_KEYS, DEFAULTS, QUERY_KEYS, PROJECT). Import from `@/lib/config`, never use `process.env` directly.
- **Schemas**: `src/schemas/` — Zod objects (runtime validation). Request/response shapes go here.
- **Types**: `src/types/` — plain TS interfaces (compile-time only, e.g. `PricingPlan`, `FeatureItem`)
- **Pricing plans**: `src/lib/pricing-plans.ts` — uses `PlanTier` enum from schemas. Edit here for plan feature lists/pricing.

## API Key Convention

All API responses go through `snakeCaseSchema()` (`src/lib/utils.ts:16`) — a `z.preprocess` that recursively converts camelCase keys to snake_case before Zod validation. **Backend must return snake_case JSON.** If backend returns camelCase keys, validation silently fails.

## Auth (critical)

- `src/middleware.ts` protects `/dashboard/`, `/onboarding`, `/invitations`; redirects authenticated users away from `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `access_token` in localStorage + cookie (for middleware). `refresh_token` in localStorage only. Cookie: sameSite=Strict, 7d max-age.
- On 401, Axios interceptor clears tokens and redirects to `/login` (unless on public path). No auto-refresh in interceptor — use `authService.refreshIfNeeded()` proactively.
- `useMe` query retries network errors (status=0) up to 2 times.
- API base: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`)

## Conventions

- **No explicit borders** — prefer background-tone separation (`bg-muted`, `bg-card` over `border`)
- **No global state** — TanStack Query cache + component-local state only
- **Fonts**: Manrope (`--font-display`) for headings, Inter (`--font-sans`) for body, loaded via `next/font/google`
- **Tailwind v4**: Color tokens in `@theme inline` block in `globals.css`, NOT in JS config. Dark variant: `@custom-variant dark (&:is(.dark *))`.
- **shadcn**: Uses `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge). All components have `data-slot` attributes.
- **Auth pages**: `font-mono`, `text-[10px]`, uppercase, `tracking-widest`, `rounded-none` inputs.
- **Directory rule**: Adding a new API domain requires a file in `src/lib/api-services/` + schema in `src/schemas/`. Both barrel-exported.
- **Route group**: `(auth)/` parens group (no URL prefix). `/projects` and `/onboarding` are flat routes because middleware matches exact prefixes.
- **Biome**: Tab indent, width 4. `noUnknownAtRules` disabled (needed for Tailwind v4).

## Build / Deploy

- Docker: `node:20-alpine`, multi-stage, copies from `.next/standalone`
- `.env.local`: stores example OAuth client IDs. Do not commit real secrets.
- No CI workflow file found in repo.
