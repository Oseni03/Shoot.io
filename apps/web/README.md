# Index — SaaS Frontend

Next.js 16 SaaS application with App Router, Tailwind CSS v4, TanStack Query, and shadcn/ui.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Biome lint |
| `npm run format` | Biome format |

## Config

`src/lib/config.ts` is the single source of truth for:

- **APP** — brand name, description, tagline, domain, copyright
- **ENV** — typed `process.env` accessors (API URL, Cloudinary, OAuth)
- **ROUTES** — all frontend routes with helpers for auth/protected/public paths
- **API_ENDPOINTS** — all backend endpoint paths (auth, users, orgs, billing, MFA, etc.)
- **STORAGE_KEYS** — localStorage/cookie key names
- **DEFAULTS** — primary color, theme colors
- **QUERY_KEYS** — TanStack Query cache keys

Import from `@/lib/config` instead of hardcoding strings or using `process.env` directly.

## Env

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

## Stack

- Next.js 16 App Router, Tailwind CSS v4, Biome 2
- TanStack React Query + Axios, Zod 4
- shadcn/ui (New York), lucide-react, framer-motion
- Better Auth (JWT)
