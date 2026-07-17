---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

In `app/(authenticated)/dashboard/settings/members/page.tsx`, the `removeMutation`, `roleMutation`, and `revokeMutation` mutations all have an empty `onError: () => {}`. When removing a member, changing a role, or revoking an invitation fails (permission error, network error, stale state — e.g. trying to change a role that another admin just changed), the confirm dialog/UI shows nothing: no toast, no inline error, no indication the action didn't happen. The user is left assuming it worked.

Add a visible error state for all three mutations — reuse whatever toast/notification pattern is already used elsewhere in the web app for mutation errors (check existing usages of a toast library in `apps/web/src/components` or `hooks` for the established pattern) rather than introducing a new one. Each error toast should be specific enough to act on (e.g. "Couldn't remove member — you may not have permission" vs. a bare "Error").

## Risk

`Normal` — UI-only change, no backend impact.

## Acceptance criteria

- [ ] A failed `removeMutation` shows a visible error toast/message to the user
- [ ] A failed `roleMutation` shows a visible error toast/message to the user
- [ ] A failed `revokeMutation` shows a visible error toast/message to the user
- [ ] Each error message is specific to the action that failed, not a generic shared string
- [ ] Successful mutations are unaffected (no regression to existing success-path UI)
- [ ] Manually verified in the browser: trigger a failure for each of the three actions (e.g. via a mocked/forced error) and confirm the toast appears

## Blocked by

None — can start immediately.
