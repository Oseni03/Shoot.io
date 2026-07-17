---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`fillFormField()` in `apps/extension/src/entrypoints/content.ts` matches an input against a field mapping (name/email/phone/headline/summary) using several `.includes()` checks, one of which is `label.includes(name)` where `name` is the input's `name` attribute. When an input has no `name` attribute — common on React/Vue-rendered forms, including Indeed's own apply modal — `name` is `""`, and `label.includes("")` is always `true` in JavaScript. That makes `matchFound` true unconditionally for any unnamed/unlabeled input, for every field mapping in turn, so the last field processed silently overwrites unrelated form fields (e.g. a hidden CSRF-adjacent input, a search box inside the modal) with resume data.

Fix the match condition so an empty `name`/`id`/`ariaLabel`/`placeholder`/`labelText` can never produce a match — guard each `.includes()` comparison (and the reverse `label.includes(name)` check) against empty strings on both sides before treating it as a hit.

## Risk

`Normal` — extension-only change, no backend impact. Fixing this changes which inputs get autofilled, so re-verify the existing "fills known fields" test cases still pass alongside the new empty-name-does-not-match case.

## Acceptance criteria

- [ ] An input with `name=""`, no `id`, no `aria-label`, no `placeholder`, and no associated `<label>` is never autofilled by any field mapping
- [ ] Existing correctly-labeled inputs (by name, id, aria-label, placeholder, or `<label for>`) still autofill as before
- [ ] `apps/extension/src/__tests__/content.test.ts` gains a regression test: an unnamed/unlabeled input alongside a correctly-labeled one in the same modal — only the labeled one gets filled
- [ ] `npm test` passes for `apps/extension/`

## Blocked by

None — can start immediately.
