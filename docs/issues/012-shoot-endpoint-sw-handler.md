---
labels: ready-for-agent
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Build the `POST /api/v1/resumes/shoot` endpoint that orchestrates the entire Shoot flow, plus the extension service worker handler that connects the content script to this API.

**Endpoint flow:**
1. Authenticate user
2. Resolve user's master resume (400 "No master resume" if missing)
3. Validate shot limit via `assert_shot_available()` (402 "Upgrade to continue" if exceeded)
4. Call `TailoringService.tailor(master_id, jd_text)` — creates TailoredResume + JobDescription
5. Call `ShotService.record_shot(user)` — increments counter
6. Call `AutoFillService.map_fields(tailored_resume)` — returns field→value map
7. Log audit event `resume.shoot`
8. Return `{ tailored_resume_id, auto_fill_fields: Record<string, string> }`

**AutoFillService:**
A shallow mapper that converts TailoredResume sections to a flat key-value dict keyed by expected form field identifiers (name, email, phone, headline, summary, etc.). The content script uses this dict to fill DOM inputs. Mappings are a configurable dict, not AI-driven.

**Extension service worker:**
Add `SHOOT_JOB` message type to the existing `background.ts` message handler. The handler:
1. Calls `POST /api/v1/resumes/shoot` with `{ job_description_text, source_url, job_title?, company? }`
2. Returns `{ tailored_resume_id, auto_fill_fields }` to the content script
3. Error responses (400/402/429/500) are propagated as structured errors matching the existing `PopupResponse` shape

New message type:
```typescript
type PopupMessage =
  | { type: "SHOOT_JOB"; payload: { 
      jobDescriptionText: string;
      sourceUrl: string;
      jobTitle?: string;
      company?: string;
    }};
```

## Risk

`Normal`

No DB changes. No migration. Touches billing indirectly via shot-limit enforcement (already handled in Slice 1).

## Acceptance criteria

- [ ] `POST /api/v1/resumes/shoot` returns 200 with `{ tailored_resume_id, auto_fill_fields }` for a valid master resume + JD
- [ ] Returns 400 if user has no master resume
- [ ] Returns 402 if user has 0 shots remaining on FREE plan
- [ ] Returns 400 if JD text is <50 characters
- [ ] `AutoFillService.map_fields()` returns a flat dict with keys: `name`, `email`, `phone`, `headline`, `summary`, and one entry per experience/education/skill item labeled generically
- [ ] Audit log entry `resume.shoot` is created with `user_id`, `meta.resume_id`, `meta.job_description_id`
- [ ] Extension background handler successfully dispatches `SHOOT_JOB` message, calls the API, returns `auto_fill_fields` in response
- [ ] Background handler returns structured error on HTTP 400/402 from API
- [ ] Background handler auto-refreshes token if 401 received (reuses existing `attemptRefresh()`)

## Blocked by

- [Slice 8 — Plan Tiers + Shot Tracking](../issues/008-plan-tiers-shot-tracking.md)
- [Slice 9 — Resume CRUD API](../issues/009-resume-crud-master-invariant.md)
- [Slice 11 — Tailoring Service (AI)](../issues/011-tailoring-service-ai.md)
