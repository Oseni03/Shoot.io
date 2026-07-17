---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`ResumeRepository.create_or_increment_usage()` and the shoot flow around it (`ShotService.assert_can_shoot()` in the `POST /resumes/shoot` handler, `app/api/v1/endpoints/resumes.py`) do a read-then-write with no row lock or atomic upsert: `assert_can_shoot` reads the current count, the AI tailoring round-trip happens, then `record_shot` writes the increment as a separate step. Two concurrent Shoot requests from the same user can both read the same "under limit" count and both proceed — silently bypassing the FREE-plan monthly cap — or, on the first shot of a new month, both attempt to `INSERT` the same `(user_id, period_start)` row and one hits the `uq_user_monthly_period` unique constraint as an unhandled `IntegrityError`, surfacing as a 500 instead of a normal success.

Make the increment atomic: either use a single `INSERT ... ON CONFLICT (user_id, period_start) DO UPDATE SET shots_used = shots_used + 1 RETURNING shots_used` (Postgres upsert) and check the limit against the *returned* post-increment count, or wrap the read-check-increment in a row-level lock (`SELECT ... FOR UPDATE`) for the duration of the request. Prefer the upsert-returning approach — it removes the race without holding a lock across the AI round-trip.

## Risk

`Concurrency` — no schema change (the unique constraint already exists), but changes the shape of `create_or_increment_usage()`'s return value and where the limit check happens relative to the increment. Re-verify `test_shot_service.py`/`test_resumes.py`'s limit-enforcement tests still pass.

## Acceptance criteria

- [ ] Two concurrent `POST /resumes/shoot` calls from a FREE user at `shots_used = 2` (limit 3) result in exactly one succeeding and one rejected with 402 — not both succeeding
- [ ] The first shot of a new calendar month never raises an unhandled `IntegrityError`, concurrently or sequentially
- [ ] `get_shots_used_in_period()` / `get_shots_remaining()` continue to return correct values after concurrent increments
- [ ] New test in `tests/services/test_shot_service.py` (or a new `tests/services/test_shot_service.py` if none exists) exercises two concurrent `record_shot` calls and asserts the final count and no unhandled exception
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
