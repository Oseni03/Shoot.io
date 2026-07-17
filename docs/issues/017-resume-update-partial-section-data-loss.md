---
labels: ready-for-agent
---

## Parent

None — standalone hardening slice, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`ResumeService.update()` (`app/services/resume_service.py`) only touches section tables when `payload.experiences is not None`. Two concrete data-loss paths follow from that one condition:

1. A client PUT that updates only `summary` or `skills` (leaving `experiences` at its default `None`) is silently a no-op for sections — 200 OK returned, nothing persisted, and the caller has no way to know their edit was dropped.
2. A client PUT that includes `experiences` but omits `educations`/`skills`/`projects`/`certifications`/`summary` triggers `delete_sections()` (which wipes **every** section table for that resume) and then `_create_sections()` only recreates the fields present in the payload — permanently deleting whatever sections were omitted from that particular request.

Fix the update contract so partial requests can't destroy data the caller didn't intend to touch. Recommend: treat the resume update payload as "any section field present in the request (including an explicit empty list) replaces that section; any field absent from the request is left untouched" — i.e. drive the replace-or-preserve decision per-section off whether the field was set on the incoming payload (Pydantic's `model_fields_set`), not off a single `experiences is not None` check gating all six sections at once.

## Risk

`Data integrity` — touches the resume update path directly; this is the same path the web app's autosave (`useResumeEditor.ts`) calls on every debounced save, so a regression here is high-blast-radius even though there's no migration.

## Acceptance criteria

- [ ] `PUT /api/v1/resumes/{id}` with only `{ "summary": {...} }` in the body updates the summary and leaves all other sections (experiences, educations, skills, projects, certifications) untouched
- [ ] `PUT /api/v1/resumes/{id}` with `{ "experiences": [...] }` and no other section keys replaces only experiences, leaving educations/skills/projects/certifications/summary as they were
- [ ] `PUT /api/v1/resumes/{id}` with `{ "experiences": [] }` (explicit empty list) clears experiences specifically, without touching other sections
- [ ] Existing "full payload replaces everything" behavior still works when all section fields are present in the request
- [ ] New tests in `tests/services/test_resume_service.py` cover each of the three partial-update cases above
- [ ] `pytest` passes

## Blocked by

None — can start immediately.
