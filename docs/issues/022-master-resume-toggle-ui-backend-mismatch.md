---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17. Touches the master-resume invariant documented in `DOMAIN.md` under Resume — do not change that invariant as part of this ticket (see Out of scope).

## What to build

`top-toolbar.tsx`'s master `Switch` renders as bidirectional (`checked={isMaster}` / `onCheckedChange={onToggleMaster}`), and `useResumeEditor.ts`'s `toggleMaster()` always calls the "set master" mutation and then optimistically flips `isMaster` locally regardless of direction. But `ResumeService.set_master()` only ever *sets* master (no-ops if already master) — there is no unset path, by design (DOMAIN.md: "there is no 'master already exists' error path," and a user's master is only ever changed by setting a *different* resume as master). Flipping the switch off on the currently-master resume calls the same set-master endpoint (a no-op server-side) while the client optimistically shows it as no longer master — a UI state that contradicts the server until the next refetch silently flips it back on, which reads as a bug to the user.

Fix the UI to match the actual backend capability rather than adding a new backend capability: disable the switch (or otherwise make it non-interactive, e.g. render it in a fixed "on, can't turn off here" state with a tooltip like "Set another resume as master to change this") when the resume is already master. The only way to change which resume is master remains setting a *different* resume's toggle to on.

## Risk

`Normal` — no backend or migration changes. UI-only fix; verify the resumes-list view (wherever else a master toggle/badge might appear) is consistent with this same rule.

## Acceptance criteria

- [ ] The master toggle in `top-toolbar.tsx` is disabled (or otherwise cannot be switched off) when the currently-viewed resume `is_master: true`
- [ ] The toggle remains fully interactive (can be switched on) for a non-master resume
- [ ] Setting a different resume as master still correctly unsets the previous one, and the previously-master resume's toolbar reflects `is_master: false` after refetch
- [ ] No optimistic local state update fires for the disabled "turn off" case (since there's no corresponding server action)
- [ ] Manually verified in the browser: toggling master on resume A, then opening resume B and setting it master, then returning to resume A shows its toggle now disabled-off

## Out of scope

- Adding an "unset master" backend capability or allowing a user to have zero master resumes — that reverses a documented invariant (DOMAIN.md, Resume entity) and needs its own product decision, not bundled into this UI fix

## Blocked by

None — can start immediately.
