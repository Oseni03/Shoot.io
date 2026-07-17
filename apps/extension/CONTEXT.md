# Extension Context

React 19 Chrome extension built with WXT, part of the resumio monorepo.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | WXT (Web Extension Tools) | Vite-based HMR, `.output/chrome-mv3/` |
| UI | React 19 + inline styles | No Tailwind in extension (popup/options use plain styles) |
| Lint/Format | Biome 2 | `apps/extension/biome.json` |
| Testing | Vitest + jsdom + React Testing Library | 40+ tests |
| Auth | Shared AuthService from `packages/shared/` | Tokens stored in `chrome.storage.local` |
| API calls | Service worker (bypasses CORS) | Popup/options use `chrome.runtime.sendMessage` |

## Architecture

### Entrypoints
- **Service worker** (`src/entrypoints/background.ts`) — message handler for LOGIN, REGISTER, MFA_VALIDATE, FORGOT_PASSWORD, RESET_PASSWORD, GET_ME, LOGOUT, REFRESH, API_REQUEST. Manages token refresh via `chrome.alarms` (15-min interval).
- **Popup** (`src/entrypoints/popup/`) — Auth UI (login, register, MFA, logout). Sends REFRESH before GET_ME on mount. 360px wide.
- **Options page** (`src/entrypoints/options/`) — Full-height sidebar with Profile / Organization / Billing sections. Org switcher, active org persistence.

### Message types (`src/types.ts`)
| Type | Direction | Purpose |
|------|-----------|---------|
| LOGIN | → SW | Email + password auth |
| REGISTER | → SW | Create account |
| MFA_VALIDATE | → SW | TOTP code verification |
| FORGOT_PASSWORD | → SW | Password reset email |
| RESET_PASSWORD | → SW | Reset token + new password |
| GET_ME | → SW | Current user profile |
| LOGOUT | → SW | Clear tokens |
| REFRESH | → SW | Silent token refresh |
| API_REQUEST | → SW | Generic API call (needs auth) |
| SHOOT_JOB | → SW | Tailor resume for a job (JD text, source URL) |
| OPEN_POPUP | → SW | Open extension popup (with fallback URL) |

### Token refresh
- On mount: popup/options send REFRESH before GET_ME
- Alarm: 15-min `chrome.alarms` for silent refresh
- Concurrency guard: one refresh in flight at a time
- Tokens never cleared on refresh failure — retried next cycle

### Shared workspace
`packages/shared/` provides AuthService, TokenStore interface, Zod schemas, config constants. Framework-independent — no React/Next.js deps.

## Commands

```bash
npm run dev          # wxt dev (HMR)
npm run test         # vitest run
npm run lint         # biome check
npx tsc --noEmit     # typecheck
```

## Testing

Tests in `src/__tests__/`:
- `background.test.ts` — 20 tests covering all message handlers (happy + error paths), concurrency guard, alarm trigger
- `popup.test.tsx` — 8 RTL tests: loading state, login form, register form, API errors, network errors, authenticated view, MFA view, logout flow
- `token-store.test.ts` — 12 tests for chrome.storage token persistence

Setup file (`setup.ts`) mocks `chrome.*` APIs globally for RTL tests.
