---
labels: implemented
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Build the WXT content script that runs on Indeed pages. This is the user-facing entry point — it injects the "Shoot" button, scrapes the job description, and fills application form fields.

**Button injection:**
- Mutation observer watches for Indeed's apply modal to appear (detected by known selectors in Indeed's DOM)
- When modal is detected, inject a "Shoot" button next to the native "Continue" / "Submit" / "Next" button
- Button styled to match Indeed's button design (blue bg, white text, matching border-radius and font size)
- If no modal is detected within 5 seconds of page load, the content script enters standby (watches for dynamic modal injection)
- If master resume is missing, button is disabled with tooltip "Set up your master resume first". Checked via the existing `API_REQUEST` message type (`{ type: "API_REQUEST", payload: { path: "/resumes" } }`) — there is no dedicated message type for this, reuse `API_REQUEST` rather than adding a new one. Note: `API_REQUEST`'s handler does not auto-retry on a 401 the way `SHOOT_JOB`'s does — if the check returns "Not authenticated" on an expired-but-refreshable token, send `REFRESH` first and retry once before concluding the user truly has no master resume (otherwise a merely-expired token gets misread as "no master resume")
- If user is unauthenticated, button click messages the service worker to call `chrome.action.openPopup()`. This API requires transient user activation, which is not reliably preserved across a content-script → SW message hop in every Chrome version — if the call throws or the popup doesn't visibly open within ~300ms, fall back to opening the web app's login page (`{VITE_FRONTEND_URL}/auth/login`) in a new tab. Confirm during manual dev testing which path actually fires — don't assume `openPopup()` alone is sufficient

**On click (the Shoot flow):**
1. Scrape job description text from the modal DOM (known selector fallback chain)
2. Scrape job title + company name from page metadata if available
3. Send `SHOOT_JOB` message to service worker with scraped data
4. Show loading state on button (spinner + "Tailoring...")
5. On success response: fill form fields using `auto_fill_fields` dict
6. Show success toast: "Resume tailored! Review and submit."
7. On partial success (some fields unfilled): toast "Resume tailored! Some fields couldn't be auto-filled."
8. On error: show error toast with the message, restore button to idle state

**Form field filling:**
- Query `input, select, textarea` inside the modal
- Match by: `name` attribute, `id` attribute, associated label text, `aria-label`
- Known mappings: `name` → name, `email` → email, `phone` → phone, `headline` → headline, `summary` / cover letter → textarea containing "why" / "cover" / "interest"
- Set value + dispatch native `input` + `change` events for React/Vue detection
- Skip file inputs (resume upload — too risky to auto-fill)

**Graceful degradation:**
- If JD can't be parsed: show "Could not read job description. Try refreshing."
- If no form fields match: still show success for tailoring but note "Auto-fill couldn't find fields to fill."
- If Indeed DOM structure changes (no known selectors match): button doesn't inject, no error

## Risk

`Normal`

No DB changes. No migration. No billing impact. Requires host permission `*://indeed.com/*` in manifest.

## Acceptance criteria

- [ ] Content script registers on `*://indeed.com/*` pages (verified by loading page in dev extension)
- [ ] "Shoot" button appears in the apply modal when it opens (both initial load and dynamic injection)
- [ ] Button is disabled with tooltip when user has no master resume (responds to extension state query via `API_REQUEST`, retries once via `REFRESH` before concluding "no master resume" on a 401)
- [ ] When unauthenticated, clicking the button either opens the extension popup (`chrome.action.openPopup()`) or, if that fails, opens the web app's login page in a new tab — one of the two visibly happens, not neither
- [ ] Clicking "Shoot" shows loading state, scrapes JD from the modal
- [ ] On successful response, form fields are filled and native events dispatched
- [ ] On error response, error toast is shown and button returns to idle
- [ ] If no modal is found, no button is injected (no visual pollution on non-apply pages)
- [ ] Tests: Vitest with jsdom — mock Indeed modal DOM, assert button injection on mutation observer trigger, assert JD scraping extracts correct text, assert form filling sets values + dispatches events
- [ ] Tests: Verify toast messages rendered for success, partial success, and error states

## Blocked by

[Slice 12 — Shoot Endpoint + Extension Service Worker Handler](../issues/012-shoot-endpoint-sw-handler.md)
