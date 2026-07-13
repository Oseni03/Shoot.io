# PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill

**Status:** Draft  
**Date:** 2026-07-12  
**Labels:** `ready-for-agent`, `epic`

---

## Problem Statement

A job seeker finds a relevant role on Indeed. To apply with a competitive resume, they must copy the job description, switch to an AI tool (ChatGPT, Claude), paste it alongside their resume, wait for a rewrite, copy the result, switch back, upload the file, and then manually fill the same personal details (name, email, phone, work history) into the application form for the dozenth time that week. This takes 10–15 minutes per application, so most applicants either send the same generic resume to every job or abandon applications midway.

## Solution

Shoot collapses this to one click. From any Indeed job page, a "Shoot" button sits next to the Apply action. One click extracts the job description, tailors the user's master resume to match it, and auto-fills the application form fields with the tailored content. The user reviews two or three fields and submits. The tailored resume is saved as a snapshot so they can revisit, edit, or use it for a different application later.

## Market Context

**Persona:** Early-to-mid career knowledge worker applying to 5–20 jobs per month on Indeed. They know they should tailor each resume but the friction of context-switching between tabs and tools means they rarely do.

**Plan impact:**
- **FREE (3 shots/month):** Activation play. First Shoot is the aha moment. At 3 shots/month, a light user can apply to one job per week for free. Heavy users hit the limit and see the upgrade prompt.
- **PRO (unlimited shots):** Revenue driver. Unlimited tailoring + auto-fill. $X/month.
- **ULTIMATE (unlimited + enterprise):** Reserved for power users and teams.

**Competition:**
- Teal ($29/mo): resume tailoring + job matching, but requires copy-pasting the JD and switching to their editor.
- Simplify (free): auto-fills Indeed forms from a stored profile, but does not tailor content per job.
- EarnBetter: one-click apply on select boards but limited Indeed support.
- Shoot's differentiator is the **bundled flow**: tailor + auto-fill in one click, no context switch, no leaving Indeed.

**Out of scope for v1:**
- Indeed job detail pages without apply modals (redirect to external ATS). The "Shoot" button won't appear on those pages — the content script detects the apply modal presence first.
- Job boards outside Indeed (LinkedIn, Glassdoor, Workday). Spread too thin kills quality.
- Manual resume editing in the extension. Editing happens on the web app.
- Uploading original resumes (PDF/DOCX). The master resume is authored in the web app's editor.

---

## User Stories

### Happy path

1. _As a job seeker, I want to see a "Shoot" button on Indeed's apply modal, so that I know I can tailor my resume from this page._

2. _As a job seeker, I want to click "Shoot" and see a loading state while my resume is being tailored, so that I know the process is working._

3. _As a job seeker, I want the tailored resume to auto-fill the application form fields, so that I only need to verify before submitting._

4. _As a job seeker, I want the tailored resume saved to my account, so that I can review or edit it later in the web app._

5. _As a returning user, I want to re-Shoot the same job (or a new job) and get a fresh tailed version, so that I can iterate on my application._

### Master resume

6. _As a new user, I want the "Shoot" button to be disabled with a tooltip ("Create your master resume first"), so that I understand I need to set up my resume before using the extension._

7. _As a user editing my resume in the web app, I want to mark exactly one resume as my master, so that the extension knows which resume to tailor from._

8. _As a user, I want the web app to prevent me from marking a second resume as master, so that there is never ambiguity about which resume the extension uses._

### Plan limits & billing

9. _As a FREE-tier user, I want to see how many shots I have left this month, so that I can budget my applications._

10. _As a FREE-tier user who hits 0 shots, I want to see a clear upgrade prompt ("Upgrade to PRO for unlimited shots"), so that I know what to do next._

11. _As a PRO user, I want unlimited shots without hitting any counter, so that I never think about my usage._

### Error states

12. _As a user, if the AI tailoring fails (API error, rate limit, content filter), I want to see an error toast saying "Tailoring failed. Try again." The application form is not filled, and no shot is deducted._

13. _As a user, if the job description cannot be parsed from the page, I want to see "Could not read job description. Try refreshing the page."_

14. _As a user, if the auto-fill succeeds partially (some fields found, some not), I want to see a success toast with "Resume tailored! Some fields couldn't be auto-filled."_

15. _As a user who is not authenticated, clicking "Shoot" opens the extension popup login, so that I can sign in and retry._

### Edge cases

16. _As a user who shoots the same job twice, I want the second shot to create a new TailoredResume (no dedup), so that I can try different tailoring angles._

17. _As a user with no internet, clicking "Shoot" shows "Network error. Check your connection." No state is lost._

18. _As a user whose session expired, the service worker refreshes the token silently before making the Shoot API call._

---

## Implementation Decisions

### Module breakdown

| Module | Location | Type | Interface |
|--------|----------|------|-----------|
| Resume models | `apps/api/app/models/resume.py` | SQLAlchemy ORM | 6 section tables + Resume + TailoredResume + JobDescription |
| Resume repository | `apps/api/app/repositories/resume_repo.py` | DB access | `get_by_id()`, `get_master()`, `create_with_sections()`, `update_section()` |
| Resume service | `apps/api/app/services/resume_service.py` | Business logic | `create_resume()`, `set_master()`, `get_with_sections()`, `list_by_user()` |
| Tailoring service | `apps/api/app/services/tailoring_service.py` | AI orchestration | `tailor(master_id, jd_text) -> TailoredResume` |
| Auto-fill service | `apps/api/app/services/autofill_service.py` | Field mapping | `map_fields(tailored_resume) -> dict[str, str]` |
| Shot counter | `apps/api/app/services/shot_service.py` | Usage tracking | `can_shoot(user_id) -> bool`, `record_shot(user_id)`, `shots_remaining(user_id)` |
| Resume endpoints | `apps/api/app/api/v1/endpoints/resumes.py` | API routes | `POST /resumes/shoot`, `GET /resumes`, `GET /resumes/{id}`, `PUT /resumes/{id}`, `POST /resumes/{id}/shoot` |
| Content script | `apps/extension/src/entrypoints/content.ts` | WXT entrypoint | Injects button, scrapes DOM, fills forms |
| Background handler | `apps/extension/src/entrypoints/background.ts` | SW message handler | New type: `SHOOT_JOB` |

### Schema changes

**New model: `Resume`**
- `id` (ULID, PK)
- `user_id` (FK → User, indexed)
- `title` (VARCHAR 255)
- `is_master` (boolean, unique per user — enforced via partial unique index)
- `created_at`, `updated_at` (TimestampMixin)

**New models: section tables** (all share the same pattern)
- `resume_experiences`: `id`, `resume_id` (FK), `company`, `title`, `location`, `start_date`, `end_date`, `is_current`, `bullets` (JSON array of strings), `sort_order`
- `resume_educations`: `id`, `resume_id` (FK), `school`, `degree`, `field`, `start_date`, `end_date`, `gpa`, `sort_order`
- `resume_skills`: `id`, `resume_id` (FK), `name`, `proficiency` (enum or int 1-5), `sort_order`
- `resume_summaries`: `id`, `resume_id` (FK, one-to-one), `content` (TEXT)
- `resume_projects`: `id`, `resume_id` (FK), `name`, `description`, `url`, `technologies` (JSON array), `sort_order`
- `resume_certifications`: `id`, `resume_id` (FK), `name`, `issuer`, `date`, `url`, `sort_order`

**New model: `TailoredResume`**
- `id` (ULID, PK)
- `user_id` (FK → User)
- `source_resume_id` (FK → Resume, nullable — nulled if master deleted)
- `job_description_id` (FK → JobDescription)
- `sections` (JSON — snapshot of all tailored content at time of creation)
- `created_at`

**New model: `JobDescription`**
- `id` (ULID, PK)
- `raw_text` (TEXT)
- `source_url` (VARCHAR 2048, nullable)
- `job_title` (VARCHAR 255, nullable — parsed from page)
- `company` (VARCHAR 255, nullable — parsed from page)
- `created_at`

**New model: `UserMonthlyUsage`**
- `id` (ULID, PK)
- `user_id` (FK → User, unique with `period_start`)
- `period_start` (DATE — first day of the month)
- `shots_used` (int, default 0)
- `created_at`, `updated_at`

**Plan tier rename:**
- `PlanTier.ENTERPRISE` → `PlanTier.ULTIMATE` in `app/models/organization.py`
- `PlanLimitEntry` gains `max_shots_per_month: int | None` (3 for FREE, `None` for PRO and ULTIMATE)
- Add `max_shots_per_month` to `PlanLimits` class in `app/core/permissions.py`
- New `assert_shot_available(plan, current_usage)` function in `app/core/permissions.py`

### API contracts

```
POST /api/v1/resumes/shoot
  Auth: Required (Bearer)
  Body: { job_description_url?: string }
  Behavior:
    1. Get user's master resume (400 if none)
    2. Content script already sent the JD text — actually, the SW sends: { job_description_text: string }
    Wait — the content script sends the JD text to the SW, the SW includes it in the request body.
    3. Resolve plan limits: check shot_available (402 if exceeded)
    4. Call tailoring service (AI) to produce TailoredResume
    5. Record shot
    6. Call auto-fill service to map fields
    7. Return { tailored_resume: TailoredResume, auto_fill_fields: Record<string, string> }
  Errors:
    400: No master resume, JD too short, AI content filter
    402: Shot limit exceeded (upgrade required)
    429: Rate limited (AI fallback — retry)
```

```
GET /api/v1/resumes
  Auth: Required
  Query: ?include_sections=true
  Returns: List of user's resumes (with master flag)
```

```
GET /api/v1/resumes/{id}
  Auth: Required
  Returns: Resume with all sections, TailoredResumes list
```

```
PUT /api/v1/resumes/{id}
  Auth: Required
  Body: partial resume update + section mutation
  Returns: Updated resume
```

```
GET /api/v1/resumes/shots/remaining
  Auth: Required
  Returns: { shots_remaining: int, period_end: string }
```

**New message type for extension (types.ts):**
```typescript
type PopupMessage =
  // ... existing types ...
  | {
      type: "SHOOT_JOB";
      payload: {
        jobDescriptionText: string;
        sourceUrl: string;
        jobTitle?: string;
        company?: string;
      };
    };

// New response shape
type ShootJobResponse = {
  tailoredResumeId: string;
  autoFillFields: Record<string, string>;
};
```

### Multi-tenancy, billing, permissions, audit

- **Multi-tenancy:** Resumes are scoped to User, not Organization. No org check needed for resume CRUD. This is a deliberate departure from the existing multi-tenancy pattern documented in `CONTEXT.md`.

- **Billing:** The shot-limit check (`assert_shot_available`) uses the organization's plan tier (resolved via the user's default/primary org membership). FREE = 3 shots/month. PRO/ULTIMATE = unlimited. This reuses the existing `PlanLimits` mechanism.

- **Permissions:** Resume ownership is enforced by `user_id` filter in the repository layer. A user can only see/edit their own resumes.

- **Audit logging:** `AuditLogService.log("resume.shoot", user_id=..., meta={"resume_id": ..., "job_description_id": ...})`. The "shoot" action is logged as a sensitive operation because it consumes a billable resource.

### ADR references

- **ADR-0001 (Chrome Extension Architecture):** The content script → SW → API flow extends Decisions 2 and 3. The new `SHOOT_JOB` message type joins the existing message types listed in Decision 2's consequences. Host permissions expand to include `*://indeed.com/*`.

### Content script design

- **Entrypoint:** `apps/extension/src/entrypoints/content.ts` (WXT convention)
- **Host permissions:** `*://indeed.com/*` in manifest
- **Button injection:** On DOM mutation observer detecting Indeed's apply modal, inject a "Shoot" button next to the native "Continue" / "Submit" button. Styled to match Indeed's design system.
- **JD scraping:** Query Indeed's known selectors for job description text. Fallback: scrape all visible text from the modal's main content area.
- **Form field mapping:** Map `TailoredResume` sections to form input names/ids/aria-labels. Strategy: query `input, select, textarea` in the modal, match by label text against a known map (name → resume.name, email → user.email, phone → user.phone, cover letter → tailored summary, etc.). Fill with `input.value = ...` and dispatch `input` + `change` events for React/Vue detection.
- **Graceful degradation:** If no fields match after tailoring, show success toast for the tailoring but surface "Auto-fill couldn't find matching fields."

---

## Testing Decisions

**What makes a good test:** Observable behaviour through public interfaces — API endpoints, service layer function calls, message handlers. Not DOM selectors (content script DOM queries are brittle; test them with integration snapshots, not unit tests).

| Module | Test framework | Prior art | Approach |
|--------|---------------|-----------|----------|
| Resume service | pytest (API tests) | `tests/services/` — use `db_session` fixture | Create resume with sections, set master, assert uniqueness enforcement |
| Tailoring service | pytest + mock AI client | `tests/services/` — mock Resend/Paystack pattern | Mock OpenAI client, assert tailored resume created with different content |
| Shot service | pytest | Use existing plan limit test pattern | Assert `can_shoot` after 3 shots on FREE, assert `record_shot` increments |
| Resume endpoints | pytest + httpx AsyncClient | `tests/api/` — use `client` fixture + auth headers | Full `POST /resumes/shoot` flow with mocked AI |
| Extension: content script | Vitest + jsdom | `apps/extension/src/__tests__/` | Mount mock Indeed DOM, assert button injects on mutation observer trigger |
| Extension: background handler | Vitest + chrome API mocks | `background.test.ts` (20 existing tests) | Test new `SHOOT_JOB` message handler: sends correct API request, returns auto-fill fields |
| Plan limits | pytest | `test_permissions.py` patterns | Assert `assert_shot_available` raises on FREE after 3, passes on PRO |

**Key testing decisions:**
- AI calls are mocked at the HTTP client layer (not patched at the function level). Follow the existing pattern of mocking Resend/Paystack.
- Indeed DOM selectors are extracted to a configurable constant so tests can override them.
- No snapshot testing of AI output (non-deterministic). Assert structural properties: output sections match input section count, each section has content.

---

## Out of Scope

- Indeed job detail pages without apply modals (external ATS redirects). The content script only activates when an apply modal is detected.
- Job boards other than Indeed (LinkedIn, Glassdoor, Workday, etc.)
- Resume upload from PDF/DOCX. The master resume is authored in the web app's editor.
- Manual editing of tailored resumes inside the extension. Editing happens on the web app.
- Undo/version history for tailored resumes. Each Shoot creates a new snapshot; there is no diff view.
- Organization/shared resumes. Every resume belongs to exactly one user.
- Multi-language resume tailoring. v1 is English-only.
- Metered billing with Paystack. Shot counting is simple per-month counter. Metered billing is deferred until 100+ paying customers.
- Billing pages inside the extension. Users are directed to the web app for subscription management.

---

## Open Questions

1. **AI model choice:** OpenAI GPT-4o-mini or Anthropic Claude 3.5 Haiku? Both are ~$0.15–0.30/1M input tokens. Prompt length: ~2K tokens (master resume + JD) → ~1K output tokens → ~$0.001 per shot. Decision deferred to implementation — either works. The `TailoringService` interface abstracts the provider.

2. **Content script button styling:** Match Indeed's native button design exactly, or use a branded "Shoot" button (Shoot's brand color, icon)? Risk of the latter being flagged as suspicious by Indeed. Recommend probing during development.

3. **Shot reset logic:** On the 1st of each month at midnight UTC, or exactly 30 days from the first shot in the period? Monthly reset on period_start (1st of month) is simpler and more predictable for users. Confirm this matches expectations.

4. **AI prompt strategy:** Single-shot prompt (master resume + JD → tailored resume) or multi-step (extract keywords first, then rewrite)? Single-shot is simpler and cheaper. Multi-step may produce better results. Iterate post-launch based on user feedback.

5. **Indeed DOM selectors for apply modal:** Need to be reverse-engineered during development. The content script's fail-fast strategy (disable button if selectors don't match) makes this a discoverable unknown.
