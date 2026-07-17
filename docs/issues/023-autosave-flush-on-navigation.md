---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`useResumeEditor.ts`'s unmount effect only calls `clearTimeout` on the pending debounced autosave — it never flushes the pending save first. Editing a field and then navigating away in-app (e.g. clicking a sidebar link) within the 1500ms debounce window silently discards that edit; nothing is saved and nothing tells the user. The existing `beforeunload` guard in `resume-editor.tsx` only covers tab close/hard refresh, not client-side route changes, so this gap is unprotected on the most common navigation path.

Fix the unmount effect to flush the pending save (fire the save mutation immediately with the latest in-memory state) instead of just clearing the timer, before the component unmounts. If an immediate flush-on-unmount isn't reliable given React's unmount timing, an acceptable alternative is intercepting in-app navigation (e.g. Next.js route change events) with the same "unsaved changes" warning the `beforeunload` guard already shows, rather than saving silently — but prefer the flush-and-save approach if it can be made reliable, since it doesn't require the user to notice a prompt.

## Risk

`Normal` — no backend changes; relies on the existing save mutation. Verify this doesn't cause a duplicate save (flush firing right before an already-scheduled debounced save also fires).

## Acceptance criteria

- [ ] Editing a field, then navigating to a different in-app route within the 1500ms debounce window, results in the edit being saved (verified via the mutation firing, not dropped)
- [ ] No duplicate/double-save fires when the debounce timer would have fired naturally around the same time as the navigation
- [ ] The existing `beforeunload` tab-close/refresh warning is unchanged
- [ ] Manually verified in the browser: edit a field, immediately click a sidebar link, reload the resume — the edit persisted
- [ ] Existing autosave tests (if any) still pass

## Blocked by

None — can start immediately.
