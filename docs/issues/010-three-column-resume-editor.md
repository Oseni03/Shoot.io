---
labels: implemented
---

## Parent

[PRD 001: Shoot — One-Click Resume Tailoring & Auto-Fill](../prd/001-shoot-one-click-resume-tailoring.md)

## What to build

Build the three-column resume editor in the web app. This is the primary UI where users author their master resume.

Layout follows the Rxresu/Reactive Resume pattern:
- **Left column (forms):** One form per section (Summary, Experience, Education, Skills, Projects, Certifications). Each form has add/reorder/delete controls. Experience and Education have date pickers. Skills have proficiency sliders (1–5). Summary is a rich textarea. Each section is collapsible.
- **Center column (preview):** Live rendered resume preview styled with the selected template. Updates in real time as the user types. If no sections have content, shows an empty-state placeholder: "Add your first experience to see the preview."
- **Right column (settings):** Template picker (thumbnail grid), font family, font size, accent color, section order drag-reorder, margins.

Top toolbar: resume title, "Set as Master Resume" toggle (only one allowed — API enforces), save indicator (auto-save on blur with debounce or explicit save button).

The page is a new route group under the existing web app layout. Uses the `GET/PUT /api/v1/resumes` endpoints from Slice 2. No AuthService change needed — existing token/cookie flow works.

**Why HITL:** Template rendering requires visual review — alignment, spacing, font rendering, PDF-like output fidelity, print preview. An agent cannot verify pixel-perfect layout. Additionally, the settings panel UX (thumbnails, color picker, drag-reorder) needs human judgment on feel and responsiveness.

## Risk

`Normal`

No DB changes. No permission changes. No billing changes.

## Acceptance criteria

- [ ] Three-column layout renders at `/resumes/new` and `/resumes/{id}/edit`
- [ ] Left column: forms for all 6 section types, add/reorder/delete works per section
- [ ] Center column: live preview renders the resume with selected template, updates on input changes (debounced 300ms)
- [ ] Empty center column shows "Add your first experience" placeholder when all sections are empty
- [ ] Right column: template picker shows at least 2 template thumbnails, switching updates the preview immediately
- [ ] Right column: font size (+ accent color + margins) controls update the preview
- [ ] "Set as Master Resume" toggle works, shows visual confirmation, disables when another resume is master
- [ ] Auto-save on blur or explicit save button — unsaved changes prompt on navigate away
- [ ] Section add/reorder inside left column is smooth, no page reload
- [ ] Responsive: three columns collapse to single-column on mobile (<768px)
- [ ] Uses existing Tailwind v4 + project's component conventions (no new UI library)

## Blocked by

[Slice 9 — Resume CRUD API](../issues/009-resume-crud-master-invariant.md)
