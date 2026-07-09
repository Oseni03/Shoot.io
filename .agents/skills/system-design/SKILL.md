---
name: system-design
description: Settle major architectural decisions, scalability constraints, and tradeoffs — and produce a module map — before the PRD is written. Use when the user wants to explore architecture, mentions "system design", or has finished /grill-me and needs to lock in the technical shape before /to-prd. Always sits between /grill-me and /to-prd.
---

# System Design

Settle every significant architectural decision — including scalability constraints and explicit tradeoffs — before the PRD is written. This skill sits between `/grill-me` and `/to-prd` and produces the handoff artifact that drives the PRD's implementation decisions section.

```
/grill-me → /system-design → /to-prd → /to-issues → /triage → /tdd
```

---

## Key Terms

**Module** — anything with an interface and an implementation.

**Deep module** — rich behaviour behind a small, stable interface. High leverage for agents: they work behind the interface without needing to understand the whole system.

**Shallow module** — interface nearly as complex as the implementation. Agents spread changes across callers. Avoid.

**Seam** — where an interface lives. A place behaviour can be swapped without editing callers.

**ADR** — Architectural Decision Record. Captures a decision, its alternatives, and the load-bearing reason the winner won.

**Deletion test** — imagine deleting a module. If complexity reappears across callers, it was earning its keep.

**Scaling unit** — the thing you add more of when the system is under load: instances, shards, read replicas, workers, cache layers. Every design has one. Name it explicitly.

**Scaling ceiling** — the point at which the current design breaks and requires a structural change, not just more hardware.

---

## SaaS Invariant Questions

Before sketching any module, answer these explicitly. They constrain the entire design — agents must never violate them.

- **Multi-tenancy** — where is tenant isolation enforced? Query layer, service layer, or both?
- **Billing** — which events are immutable? What triggers plan limit enforcement?
- **Permissions** — is access control declarative (policy files) or imperative (scattered `can()` calls)?
- **Audit log** — which entities are append-only? Which writes must never be lost?

---

## Scalability Questions

Answer these before finalising any module boundary or data model. Skipping them produces a design that works at launch and breaks at scale.

### Load profile

- What is the expected request volume at launch, at 10x, and at 100x?
- Is the load **read-heavy**, **write-heavy**, or **mixed**? The answer determines caching strategy and replication topology.
- Are there **burst patterns** — end-of-month billing runs, import jobs, notification fans, scheduled reports? Burst workloads need a different design than steady-state workloads.

### Data growth

- Which tables grow without bound? At what row count does a full-table query become unacceptable?
- Is pagination, archival, or partitioning needed from day one — or is it a future concern? Name the trigger: "we add partitioning when the events table exceeds 50M rows."
- Which queries will hit indexes and which will require scans? Identify any query that could become a table scan at scale and resolve it now.

### Concurrency and contention

- Are there shared mutable resources — counters, seat limits, quota buckets, approval queues — that multiple writers will touch simultaneously? Name them.
- What is the consistency requirement for each: **strong consistency** (a seat cannot be oversold), **eventual consistency** (an analytics counter can lag), or **best-effort** (a notification can be missed)?
- Where is optimistic locking, pessimistic locking, or a queue needed? Pick the right tool per contention point — don't use one answer for all of them.

### External dependencies

- Which external services are in the critical path — a request fails if they fail?
- Which can be **degraded gracefully** — the feature degrades but the request succeeds?
- Which can be **deferred** — moved to a background job so the user isn't waiting?
- What is the timeout, retry, and circuit-breaker strategy for each critical-path dependency?

### Caching

- What can be cached, and at which layer: in-process memory, distributed cache (Redis), CDN, or HTTP cache headers?
- What is the cache invalidation strategy for each? "We'll cache it and invalidate on write" is a plan — "we'll cache it" is not.
- What is the blast radius if the cache is cold or wrong? Identify any case where a cache miss causes a cascade.

### Background jobs and queues

- Which operations are too slow or too risky to run in the request/response cycle?
- What is the retry strategy for failed jobs? At-most-once, at-least-once, or exactly-once semantics — and what does idempotency look like?
- What happens if the queue backs up? Is there a dead-letter queue? Who monitors it?

### Scaling ceiling

- At what load does the current design structurally break — not just slow down?
- What is the migration path when that ceiling is hit? The ceiling doesn't have to be high, but it must be named. Unnamed ceilings become production incidents.

---

## Process

### 1. Load context

Read the conversation, `DOMAIN.md`, `CONTEXT.md`, and `docs/adr/`. If anything is still ambiguous — missing constraints, unclear scope, unresolved non-negotiables — re-interview one question at a time before sketching anything.

### 2. Sketch and quiz

Draft four things and present them to the user together:

- **Context boundary** — one paragraph: what the system does, who calls it, what it calls
- **Module map** — 3–7 modules, each with a name, one-sentence responsibility, and a depth assessment (deep / shallow)
- **Load and growth profile** — a short summary of the answers to the scalability questions above
- **Two or three options** for the single hardest architectural decision, with their scalability implications

Ask:

- Does the module breakdown feel right?
- Does the load and growth profile match their expectations?
- Which option do they lean toward, and what constraints rule the others out?

One question at a time. Iterate until the design is settled.

### 3. Draft ADRs

For each decision that eliminates a real alternative a future engineer might re-propose, draft an ADR. Write to `docs/adr/` only on explicit confirmation.

```markdown
# ADR-XXXX: <title>

## Status

Accepted

## Context

Why this decision needed to be made.

## Decision

What was decided. One sentence.

## Options considered

| Option   | Scalability tradeoff | Complexity tradeoff |
| -------- | -------------------- | ------------------- |
| Option A | ...                  | ...                 |
| Option B | ...                  | ...                 |

## Consequences

What becomes easier, harder, or off the table — including at scale.

## Scaling ceiling

The point at which this decision needs to be revisited and what the migration path looks like.
```

### 4. Produce the handoff artifact

Write this document and hand it to `/to-prd`. Do not publish it to the issue tracker.

```markdown
## Context Boundary

One paragraph: what the system does, who calls it, what it calls.

## Module Map

| Module | Responsibility | Depth          |
| ------ | -------------- | -------------- |
| Name   | One sentence   | Deep / Shallow |

## SaaS Invariants

| Concern          | Enforcement point                     |
| ---------------- | ------------------------------------- |
| Tenant isolation | <where>                               |
| Billing events   | <immutability contract>               |
| Permissions      | <declarative / imperative, and where> |
| Audit log        | <which entities, which operations>    |

## Scalability Profile

| Dimension      | Current design handles | Scaling ceiling | Migration path |
| -------------- | ---------------------- | --------------- | -------------- |
| Read load      | <what>                 | <limit>         | <next step>    |
| Write load     | <what>                 | <limit>         | <next step>    |
| Data volume    | <what>                 | <limit>         | <next step>    |
| Burst patterns | <what>                 | <limit>         | <next step>    |
| Concurrency    | <what>                 | <limit>         | <next step>    |

## Contention Points

Numbered list: shared mutable resource → consistency requirement → resolution strategy (optimistic lock / queue / idempotency key).

## Caching Strategy

| What is cached | Layer   | Invalidation strategy | Cold-cache blast radius |
| -------------- | ------- | --------------------- | ----------------------- |
| <what>         | <where> | <how>                 | <impact>                |

## Background Jobs

| Job   | Trigger | Retry strategy | Failure mode   |
| ----- | ------- | -------------- | -------------- |
| <job> | <when>  | <strategy>     | <what happens> |

## External Dependencies

| Dependency | In critical path? | Failure strategy                  |
| ---------- | ----------------- | --------------------------------- |
| <dep>      | Yes / No          | Timeout + retry / degrade / defer |

## Key Seams

Numbered list: name, why it's a real seam, what sits behind it.

## Architectural Decisions

Numbered list: chosen option + one-line reason + scaling implication. ADR reference where applicable.

## Tradeoffs

Makes easy: specific things this design enables — including at scale.
Makes hard: specific things this design closes off or defers — and what triggers revisiting them.

## Open Questions

Anything unresolved that /to-prd or implementation must revisit.
```
