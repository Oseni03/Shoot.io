---
name: to-issues
description: Break a PRD into independently-grabbable, DAG-ordered, vertical slice issues on the project issue tracker. Use after /to-prd when the user wants implementation tickets. Each issue is a tracer bullet — a thin end-to-end slice through every layer. Always runs before /triage.
---

# To Issues

Break the PRD into vertical slice issues. Each issue is a tracer bullet — a thin path end-to-end through every layer (schema → API → UI → tests) that delivers something demoable or verifiable on its own. Never a horizontal slice of one layer.

---

## Process

### 1. Load context

Read the PRD issue and `DOMAIN.md`. All issue titles and descriptions must use the project's domain vocabulary — not generic technical language.

### 2. Draft the slices

Each slice must:

- Cut through **all integration layers** end-to-end, not just one
- Be demoable or verifiable on its own when complete
- Fit inside one agent context window (~100k tokens) — split if not

Classify every slice:

**AFK** — the agent implements and merges without human involvement. Prefer these.

**HITL** — requires human judgment: an architectural decision, a design review, external access, or manual QA. Explain why it cannot be delegated.

Flag any slice that touches high-risk areas:

- `Migration` — database migrations; never parallelise with other migration slices
- `Billing` — billing events or subscription state; single-thread by default
- `Isolation` — multi-tenant row isolation; requires an explicit isolation acceptance criterion

### 3. Map the dependency graph

Build the DAG. A slice can only start when all its blockers are merged. Slices with no shared dependency can run in parallel — subject to risk classification rules above.

### 4. Quiz the user

Present the breakdown as a numbered list. For each slice show:

- **Title** — short, domain-vocabulary name
- **Type** — AFK / HITL
- **Risk** — Normal / Migration / Billing / Isolation
- **Blocked by** — slice numbers or "none"
- **Stories covered** — which PRD user stories this satisfies

Ask:

- Is the granularity right — too coarse or too fine?
- Are the dependency edges correct?
- Are the HITL/AFK classifications right?
- Should any slices merge or split?

Iterate until the user approves the breakdown.

### 5. Publish

Publish in dependency order — blockers first — so real issue IDs can be referenced. Use this template:

---

## Parent

Link to the PRD issue.

## What to build

End-to-end description of this vertical slice. Describe observable behaviour, not layer-by-layer implementation. No file paths. No full code snippets — exception: a decision-encoding prototype snippet (schema shape, state machine) trimmed to the decision-rich parts.

## Risk

`Normal` / `Migration` / `Billing` / `Isolation` — and the parallelisation rule that applies.

## Acceptance criteria

- [ ] Criterion 1 — verifiable by an agent or automated test
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

Link to blocking issue(s), or "None — can start immediately."

---

Label AFK-ready issues `ready-for-agent`. Label HITL issues `ready-for-human`. Do not close or modify the parent PRD issue.
