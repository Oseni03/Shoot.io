---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Create the Resume domain entity with six normalized section tables. Build the repository, service, and REST API for resume CRUD. Enforce the master resume invariant: exactly one `is_master = true` per user via a partial unique index. Create the `TailoredResume` and `JobDescription` tables as schemas-only placeholders (no service logic yet — just models + migration).

The `ResumeService` handles create/read/update, section management (add/remove/reorder bullet points, dates, etc.), and master flag toggling (clears previous master when setting a new one). Endpoints follow the existing thin-route pattern: `GET /api/v1/resumes`, `GET /api/v1/resumes/{id}`, `PUT /api/v1/resumes/{id}`, plus section sub-resources. Ownership enforced by `user_id` filter — a user only sees their own resumes.

This slice delivers the data foundation. No web UI yet — verified via API tests and pytest.

## Risk

`Migration`, `Isolation`

- Migration creates 8 new tables (Resume, Experience, Education, Skill, Summary, Project, Certification, TailoredResume, JobDescription) plus a partial unique index `(user_id)` WHERE `is_master = true`.
- All Resume data is scoped to User (not Organization). Every repository query filters by `user_id`. Test must verify a user cannot access another user's resumes.

## Acceptance criteria

- [ ] `Resume` model has `id` (ULID), `user_id` (FK → User), `title`, `is_master` (boolean, nullable), `created_at`, `updated_at`
- [ ] Partial unique index `uq_resume_master_per_user` on `(user_id)` WHERE `is_master = true` exists in migration
- [ ] 6 section tables exist (Experience, Education, Skill, Summary, Project, Certification) with FK to `resumes.id`, each with `id`, `resume_id`, content columns, `sort_order`
- [ ] `TailoredResume` table exists with `id`, `user_id`, `source_resume_id`, `job_description_id`, `sections` (JSON), `created_at` — no service logic yet
- [ ] `JobDescription` table exists with `id`, `raw_text`, `source_url`, `job_title`, `company`, `created_at` — no service logic yet
- [ ] `POST /api/v1/resumes` creates a resume with sections, validates section data shape
- [ ] `GET /api/v1/resumes` returns user's resumes, ordered by `created_at` desc
- [ ] `GET /api/v1/resumes/{id}` returns full resume with all sections nested
- [ ] `PUT /api/v1/resumes/{id}` updates title and/or sections, rejects updates to another user's resume (404)
- [ ] Setting `is_master = true` on a resume clears `is_master` on any other resume owned by the same user
- [ ] Setting `is_master = true` on a second resume without clearing the first returns an error (or silently clears the previous — decision encoded in service)
- [ ] A user's second resume cannot be created with `is_master = true` if one already exists (enforced at service layer)

## Blocked by

None — can start immediately (parallel with Slice 1).
