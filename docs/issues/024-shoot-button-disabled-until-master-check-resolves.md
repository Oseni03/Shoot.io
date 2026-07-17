---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md) — story 6 ("the 'Shoot' button to be disabled with a tooltip... so I understand I need to set up my resume before using the extension"), surfaced as unmet during a full-codebase audit on 2026-07-17.

## What to build

`injectShootButton()` calls in `apps/extension/src/entrypoints/content.ts` — both the initial-load call and the `MutationObserver` callback — hardcode `hasResume=true`, so the "disabled, no master resume" branch is unreachable at button-creation time. The real check, `checkHasMasterResume()`, only runs once on `main()` and corrects the button state afterward via `updateShootButtons()`. Between button injection and that async check resolving, a user with no master resume sees an enabled Shoot button and can click it.

Fix the injection sites to pass the actual known state instead of a hardcoded `true`: track `hasResume` in module state (set once `checkHasMasterResume()` resolves, defaulting to `false`/disabled until then) and read that value at each injection site, rather than injecting enabled-by-default and correcting after the fact.

## Risk

`Normal` — extension-only change. Verify the existing `updateShootButtons()` correction path still works for buttons injected after the state is known (e.g. a modal that appears after the initial check already resolved).

## Acceptance criteria

- [ ] A Shoot button injected before `checkHasMasterResume()` has resolved starts disabled, not enabled
- [ ] Once `checkHasMasterResume()` resolves to `true`, any already-injected disabled buttons become enabled (existing `updateShootButtons()` behavior, unchanged)
- [ ] A Shoot button injected after `checkHasMasterResume()` has already resolved reflects the correct state immediately at injection, not after a delay
- [ ] `content.test.ts` gains a regression test asserting a button injected pre-resolution starts disabled
- [ ] `npm test` passes for `apps/extension/`

## Blocked by

None — can start immediately.
