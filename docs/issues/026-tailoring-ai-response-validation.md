---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md), surfaced as a gap during a full-codebase audit on 2026-07-17.

## What to build

`TailoringService` (`app/services/tailoring_service.py`) validates that the AI's JSON response has the expected top-level keys present, but not that each key's *value* has the expected shape. `AutoFillService.map_fields()` (`app/services/autofill_service.py`) then calls `.get()` on each item under the assumption they're dicts with known fields. If the AI returns a structurally-off response — e.g. `"experiences": ["just a string"]` instead of a list of objects — `AutoFillService` raises an unhandled `AttributeError`, and the `POST /resumes/shoot` request fails as a bare 500 instead of a controlled error, and (depending on where in the flow this happens relative to `record_shot`) may consume a shot for a request that produced nothing usable.

Add shape validation on the AI response before it reaches `AutoFillService` — validate against the same Pydantic schema the tailored-sections JSON is supposed to conform to (reuse/extend whatever schema already models a `TailoredResume`'s `sections`). On validation failure, raise a specific, caught exception that the `POST /resumes/shoot` endpoint maps to a controlled error response (e.g. 502 "Tailoring failed, try again") rather than an unhandled 500 — and confirm no shot is recorded for a request that fails this validation.

## Risk

`Normal` — no migration. Touches the Shoot request's error path; verify this doesn't change behavior for the normal (valid AI response) case.

## Acceptance criteria

- [ ] A malformed AI response (wrong types for one or more section fields) is caught before reaching `AutoFillService` and results in a controlled error response, not an unhandled 500
- [ ] The controlled error response uses a clear error code the extension's existing error-toast handling can render (matching the pattern used for `UNAUTHORIZED`)
- [ ] A shot is **not** recorded (`ShotService.record_shot`) when tailoring fails this validation
- [ ] A well-formed AI response continues to succeed exactly as before (no regression)
- [ ] New tests in `tests/services/test_tailoring_service.py` cover at least one malformed-shape case per section type that previously would have reached `AutoFillService`
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
