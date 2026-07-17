---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md), story 10, and [Issue 014's](./014-shots-remaining-ui.md) own Out of Scope note recommending this exact follow-up — surfaced as still-open during a full-codebase audit on 2026-07-17.

## What to build

`handleShoot()`'s error branch in `apps/extension/src/entrypoints/content.ts` only special-cases the `UNAUTHORIZED` error code (prompting sign-in); a 402 response from `POST /resumes/shoot` (shot limit reached) falls through to the generic `"Shoot failed. Try again."` toast — indistinguishable from a real failure, and giving the user no path to actually resolve it (upgrading).

Add a case for the shot-limit error code alongside the existing `UNAUTHORIZED` branch: show a toast like "Monthly shot limit reached — Upgrade to PRO for unlimited shots" with a link/action opening the web app's billing page in a new tab, following the same `handleOpenPopup`/external-link pattern already used for the sign-in case.

## Risk

`Normal` — extension-only change, no backend impact (the 402 response already exists and is already correctly returned by the shoot endpoint).

## Acceptance criteria

- [ ] A 402 response from `POST /resumes/shoot` shows a distinct "Upgrade to PRO for unlimited shots" toast, not the generic failure toast
- [ ] The upgrade toast includes a way to reach the web app's billing page (new tab), consistent with how the sign-in prompt already opens the web app
- [ ] Other error codes (network error, `UNAUTHORIZED`, generic failure) continue to show their existing distinct messages, unchanged
- [ ] `content.test.ts` gains a regression test for the 402 case asserting the upgrade-specific toast content
- [ ] `npm test` passes for `apps/extension/`

## Blocked by

None — can start immediately.
