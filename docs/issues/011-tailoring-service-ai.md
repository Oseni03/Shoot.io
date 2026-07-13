---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Build the `TailoringService` — the AI service that takes a master resume and a job description and produces a tailored resume. This is the core intelligence of the Shoot flow.

The service:
1. Loads the master resume with all sections from the `ResumeService`
2. Constructs a structured prompt joining resume sections + job description
3. Calls the AI provider (OpenAI GPT-4o-mini or Anthropic Claude 3.5 Haiku — abstracted behind a `_call_ai(text) -> str` interface)
4. Parses the AI response into per-section tailored content
5. Creates a `TailoredResume` snapshot record (JSON `sections` column) with a reference to the source Resume and the JobDescription
6. Stores the `JobDescription` record for provenance
7. Returns the `TailoredResume`

The AI provider is abstracted so the model choice is a config swap, not a code change. No caching layer in v1 — every shoot is a fresh AI call. The prompt is versioned in the codebase for iteration.

Environment: `AI_API_KEY` (env var, required), `AI_MODEL` (default `gpt-4o-mini`).

## Risk

`Migration` (TailoredResume + JobDescription tables already created in Slice 2; this slice adds no new tables — only service logic)

## Acceptance criteria

- [ ] `TailoringService.tailor(master_resume_id, jd_text, jd_source_url?)` loads the master resume, calls AI, returns a `TailoredResume` with populated `sections` JSON
- [ ] `TailoredResume.sections` JSON has the same section keys as the master resume (experience, education, skills, summary, projects, certifications)
- [ ] `TailoredResume.sections` content differs from master resume (proves AI rewrote it — verified in test with mocked AI returning known delta)
- [ ] `JobDescription` is created with `raw_text`, `source_url` (optional), `job_title` (parsed), `company` (parsed)
- [ ] `TailoredResume` references both `source_resume_id` and `job_description_id` via FK
- [ ] AI provider is abstracted behind a function — changing from OpenAI to Anthropic requires changing one import + env var, not service logic
- [ ] Short JD (<50 chars) raises `BadRequestError` ("Job description too short")
- [ ] AI call failure (timeout, invalid response, content filter) raises wrapped `AppError` with detail message
- [ ] Prompt is versioned (exported as `TAILOR_PROMPT_V1`) so changes are tracked in git

## Blocked by

[Slice 9 — Resume CRUD API](../issues/009-resume-crud-master-invariant.md)
