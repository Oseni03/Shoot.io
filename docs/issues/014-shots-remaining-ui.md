---
labels: implemented
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Surface shot usage to the user. Today `GET /api/v1/resumes/shots/remaining` exists and is fully wired server-side (Issue 008), but nothing in the extension or web app calls it — a FREE user can burn all 3 shots per month with zero visibility into their remaining count, and no upgrade nudge when they hit zero. This is the activation-funnel mechanism the PRD's Market Context section describes ("Heavy users hit the limit and see the upgrade prompt") and it currently doesn't exist anywhere.

Add a shot counter to two surfaces:

1. **Extension popup, authenticated view:** below the user's name/email, show "`{shots_remaining}` shots left this month" for FREE-plan users. PRO/ULTIMATE users see nothing extra (unlimited — don't show a counter that implies a limit). When `shots_remaining` is 0, replace the counter with an inline "Upgrade to PRO for unlimited shots →" link opening the web app's billing page in a new tab (reuse the pattern already built for the Options page billing link in Issue 004).
2. **Web app resume editor toolbar** (the three-column editor from Issue 010): same counter + upgrade link, shown next to the existing save indicator.

Both surfaces call the same endpoint on mount: `GET /api/v1/resumes/shots/remaining` → `{ shots_remaining: number | null, period_end: string }`. `null` means unlimited (PRO/ULTIMATE) — render nothing, not "unlimited".

**Extension-specific:** add a `GET_SHOTS_REMAINING` message type to the service worker (`background.ts`), following the existing `GET_ME` handler pattern — it calls the endpoint with the stored access token and returns the parsed response to the popup.

## Risk

`Normal` — no DB changes, no migration, read-only endpoint already exists and is already tested (Issue 008).

## Acceptance criteria

- [ ] Extension popup's authenticated view shows "`N` shots left this month" for FREE-plan users, fetched via a new `GET_SHOTS_REMAINING` service worker message
- [ ] Extension popup shows nothing extra for PRO/ULTIMATE users (`shots_remaining: null` renders no counter)
- [ ] When `shots_remaining` is 0, the popup shows an "Upgrade to PRO" link instead of the counter, opening the web app's billing page in a new tab
- [ ] Web app's resume editor toolbar (`/resumes/{id}/edit`) shows the same counter next to the save indicator, for FREE-plan users
- [ ] Web app editor shows the same "Upgrade to PRO" link at 0 shots remaining
- [ ] Counter reflects `period_end` correctly — does not reset until the 1st of the next month (matches `ShotService`'s existing period logic, no new logic needed here)
- [ ] `npm run lint` passes for `apps/extension/` and `apps/web/`
- [ ] `npm test` passes for the new `GET_SHOTS_REMAINING` handler (mocked fetch, mocked chrome.storage — follow existing `background.test.ts` patterns)

## Out of scope

- Any change to `ShotService`, `assert_shot_available()`, or the `/shots/remaining` endpoint itself — this issue is pure UI consuming an existing, already-tested contract
- Handling the 402 response from `POST /resumes/shoot` with upgrade-specific messaging — that's the content script's error-toast path in [Issue 013](./013-indeed-content-script.md); recommend amending 013's generic error toast to special-case 402 with "Upgrade to PRO for unlimited shots" instead of building that here, since 013 owns the Shoot error-state UI

## Blocked by

[008 — Plan tiers + shot tracking](./008-plan-tiers-shot-tracking.md) — already merged, endpoint exists.
[010 — Three-column resume editor](./010-three-column-resume-editor.md) — already merged, toolbar exists to extend.
