# DOMAIN.md

The ubiquitous language for this codebase. Every agent, skill, test, UI label, API route, and database column uses the terms defined here. When a term in conversation conflicts with a term here, this file wins — or it gets updated via `/improve-skill`.

Read this file at the start of every session before writing any code, tests, or issue descriptions.

---

## Core Entities

Define each entity your product works with. Use this structure:

---

### `<EntityName>`

**What it is:** One sentence from the user's perspective — not the database perspective.

**Relationships:**

- Belongs to one `<OtherEntity>`
- Has many `<OtherEntity>`

**Invariants:** Rules that must never be violated, regardless of context.

- Example: "Always belongs to exactly one Workspace — orphaned records are invalid"

**Agent note:** Specific guidance for agents working with this entity.

- Example: "Never query without a `workspace_id` filter — even in admin contexts"

---

<!-- Add an entry for every core entity in your domain -->

---

## SaaS Boundary Entities

These entities carry elevated risk. Agents must read and respect their invariants before touching any related code.

### `Workspace` — the Tenant

**What it is:** The top-level isolation boundary. All user-owned data belongs to a Workspace.

**Invariants:**

- Every query returning user-owned data must filter by `workspace_id`
- The workspace is resolved from the authenticated session — never from a URL parameter or request body
- Cross-workspace data access is never permitted, including in admin or internal contexts

**Agent note:** If a query touches a user-owned table and has no `workspace_id` filter, stop and raise a HITL checkpoint before proceeding.

---

### `Subscription` — the Billing Record

**What it is:** The record of a Workspace's current plan, its status, and its billing history.

**Invariants:**

- Billing events are **append-only** — never update or delete a billing event, only insert
- Plan enforcement is checked at `<where — middleware / service layer / query layer>`
- The current plan is accessed via `<how — e.g. session.workspace.plan>`

**Agent note:** Any code that gates a feature behind a plan limit must use the established enforcement point — never implement ad-hoc plan checks inline.

---

### `<Permission / Role Entity>`

**What it is:** `<your definition>`

**Invariants:**

- Access control is `<declarative — policy files at <path> / imperative — can() checks at call sites>`
- Permission checks are never bypassed, including in test helpers and seed scripts

---

## Key Operations (Verbs)

Domain verbs used to name functions, API routes, and tests. Using these consistently lets agents navigate the codebase without guessing.

| Verb     | What it means in this domain | Example usage                           |
| -------- | ---------------------------- | --------------------------------------- |
| `<verb>` | `<domain meaning>`           | `publishCourse`, `activateSubscription` |

---

## Glossary

Short definitions for terms that appear in code but could be misread or confused.

| Term     | Definition    |
| -------- | ------------- |
| `<term>` | One sentence. |
