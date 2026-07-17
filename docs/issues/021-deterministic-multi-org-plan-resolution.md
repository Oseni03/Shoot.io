---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`_resolve_plan()` in `app/api/v1/endpoints/resumes.py` picks the plan that gates shot limits via `user.memberships[0]` — the `memberships` relationship on `User` (`app/models/user.py`) has no `order_by`, so which org's plan applies is whatever order the DB happens to return, not a defined rule. A user who belongs to both a FREE org and a PRO org can get inconsistent shot-limit behavior across requests.

Make the selection deterministic: order `memberships` by `created_at` ascending (or add `order_by` directly on the relationship) and resolve the plan from the earliest-joined membership. This is a tiebreak rule, not a "best plan wins" rule — if the product later wants "most permissive plan wins" or an explicit "primary org" concept, that's a separate decision; this ticket only needs to stop the behavior from being nondeterministic.

## Risk

`Normal` — no migration. Changes which org's plan applies for any user with 2+ memberships; low blast radius today since multi-org membership is uncommon, but worth a regression test given it gates billing behavior (shot limits).

## Acceptance criteria

- [ ] `User.memberships` relationship (or the query in `_resolve_plan()`) is explicitly ordered by `created_at` ascending
- [ ] A user with a FREE membership created before a PRO membership consistently resolves to the FREE plan for shot-limit purposes, across repeated calls
- [ ] Existing single-org-membership behavior is unchanged
- [ ] New test in `tests/api/test_resumes.py` covers a user with two memberships and asserts the plan resolves to the earlier-created one every time
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
