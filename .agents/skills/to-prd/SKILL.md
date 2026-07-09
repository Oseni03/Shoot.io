---
name: to-prd
description: Synthesize the current conversation into a structured PRD. Use after /grill-me and /system-design when the user wants to produce a written spec. Do NOT re-interview — everything needed is already in context. Always precedes /to-issues.
---

# To PRD

Synthesize the conversation and codebase into a PRD. Do not re-interview the user. Everything needed came out of `/grill-me` and `/system-design`.

---

## Process

### 1. Load context

Read `DOMAIN.md`, `CONTEXT.md`, and `docs/adr/`. The PRD must use the project's domain vocabulary throughout — no invented terms, no generic language where a domain term exists.

### 2. Sketch modules

Identify the modules that need to be built or modified. For each, answer:

- Is it **deep** — rich behaviour behind a small, stable interface?
- Or **shallow** — interface nearly as complex as the implementation?

Prefer deep. Actively look for behaviour that can be hidden behind a clean interface. An agent working behind a deep interface doesn't need to understand the whole system.

Show the module sketch to the user and confirm it matches their expectations before writing the full PRD.

### 3. Write the PRD

---

## Problem Statement

The problem from the user's perspective. One paragraph. No technical jargon.

## Solution

What changes about the user's experience. One paragraph.

## Market Context

- Which user persona benefits, and at which plan tier?
- What is the activation or retention impact?
- What is explicitly out of scope for this version and why?

## User Stories

A numbered, exhaustive list covering happy paths, edge cases, empty states, and error states.

Format: _As a `<actor>`, I want `<feature>`, so that `<benefit>`._

## Implementation Decisions

Resolved choices from the grill session and system design:

- Modules to build or modify, with their public interfaces
- Schema changes
- API contracts
- How this touches multi-tenancy, billing, permissions, or audit logging
- ADR references where applicable

No file paths. No full code snippets. Exception: a decision-encoding prototype snippet (state machine, schema shape, type) may be inlined if it captures a decision more precisely than prose — trim to the decision-rich parts only.

## Testing Decisions

- What makes a good test for this feature: observable behaviour through public interfaces, not implementation details
- Which modules will have tests written
- Prior art in the codebase to follow

## Out of Scope

An explicit list. Anything not listed here is in scope.

## Open Questions

Anything unresolved that implementation must revisit.

---

### 4. Publish

Publish the PRD as an issue on the project issue tracker. Label it `ready-for-agent`. This issue is the destination — it is not itself an actionable implementation step. `/to-issues` will break it apart.
