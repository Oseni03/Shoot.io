---
labels: implemented
---

## Parent

[PRD: Chrome Extension Boilerplate](../prd/chrome-extension-boilerplate.md)

## What to build

Finalize the extension's integration into the monorepo. This covers everything that needs human judgment: CI configuration, test setup, documentation, and build workflow.

**Turbo configuration:** Finalize `turbo.json` tasks. The extension produces `.output/` (not `.next/` or `dist/`). The shared workspace produces `dist/` if compiled. Verify the task graph accounts for `packages/shared/` being built before `apps/*`.

**Test setup:** Configure Vitest for `apps/extension/`. Add `vitest-chrome` or the WXT test helpers for mocking `chrome.*` APIs. Write tests for:
- Service worker message handlers (send each message type, verify response)
- Token store (storing, reading, clearing tokens, persistence across simulated restarts)
- Popup login form validation (React Testing Library)

**Linting:** Biome already configured at root — verify `apps/extension/` is picked up by `biome.json`. The shared workspace uses TypeScript only — Biome should lint it too.

**CI / GitHub Actions:** The repo has no CI workflow yet. This slice may optionally create the first one: `npm run lint && npm run test && npx tsc --noEmit` on PRs. This requires deciding on Node version, OS matrix, and caching strategy.

**Documentation updates:**
- Update `AGENTS.md` setup instructions with extension steps
- Ensure `apps/extension/.env.example` exists with `VITE_API_URL`
- Document the development workflow (install deps, `npm run dev` at root, load unpacked from `.output/chrome-mv3/`)

**HITL reason:** CI configuration depends on the team's preferred GitHub Actions patterns (Node version, caching strategy, matrix, artifact retention) which are not settled in this repo yet. The test coverage threshold (what's "enough") and whether to create the first CI file or wait are organizational decisions. Manual QA of the extension load flow is also necessary (Chrome extension loading is inherently manual).

## Risk

`Normal` — no database, no billing, no migrations.

## Acceptance criteria

- [ ] `turbo run dev` at root starts the extension dev server alongside the API and web app
- [ ] `npx tsc --noEmit` passes for `apps/extension/` (TypeScript type-check)
- [ ] `turbo run lint` at root lints the extension and shared workspace
- [ ] `turbo run test` at root runs extension tests
- [ ] Extension tests cover service worker message handlers (happy path + error path)
- [ ] Extension tests cover the chrome.storage token store
- [ ] Popup login form tests cover validation states
- [ ] `apps/extension/.env.example` documents `VITE_API_URL`
- [ ] `AGENTS.md` is updated with extension setup step
- [ ] Documentation explains how to load the extension in Chrome as unpacked

## Blocked by

[001 — Extension scaffold + login flow](./001-extension-scaffold-login.md) — the extension must exist to test and lint it.  
[003 — Registration, MFA, logout, and error states](./003-extension-reg-mfa-errors.md) — tests should cover the full auth surface.  
[004 — Extension options page](./004-extension-options-page.md) — test setup covers both popup and options.  
[005 — Token refresh via alarms](./005-extension-token-refresh.md) — final feature before polish.
