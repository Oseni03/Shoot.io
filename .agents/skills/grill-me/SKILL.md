---
name: grill-me
description: Relentlessly interview the user about a plan or feature — covering market validity, domain grounding, and technical design — until every decision is resolved and nothing is left open. Use when the user mentions "grill me", wants to validate an idea, starts describing something to build, or needs to stress-test a plan before writing a PRD. Always run before /to-prd.
---

# Grill Me

Interview me about this plan until we have shared understanding and every decision is settled. Walk down each branch of the decision tree one question at a time. For every question, give your own recommended answer with reasoning — don't just ask, push back on weak answers.

If a question can be answered by reading the codebase or context files, read them instead of asking.

---

## Phase 1 — Market Validity

Validate the _why_ before touching anything technical. A beautifully implemented feature nobody needed is the most expensive outcome.

Ask:

- What specific problem does this solve, and for which user persona?
- Does a competing product already do this — and at which pricing tier?
- Where does this sit on the activation-to-retention chain: acquisition, activation, retention, or revenue?
- What is the cost of NOT building this? What breaks or stagnates?
- Is this table stakes, a genuine differentiator, or a distraction?

Do not move to Phase 2 until the market rationale is clear and agreed.

---

## Phase 2 — Domain Grounding

Before any implementation discussion, anchor to the project's language.

- Read `DOMAIN.md`. Challenge any term in the user's description that conflicts with the glossary.
- Read `CONTEXT.md`. Surface any invariant or pattern that constrains what can be built.
- If either file is missing, flag it before continuing: without them, invented vocabulary will poison the PRD and every issue downstream.

Note any new domain terms that emerge during the interview — they belong in `DOMAIN.md`.

---

## Phase 3 — Technical Design

Walk the design tree one decision at a time:

- Which core entities are involved, and how do they relate?
- Where does this touch the SaaS danger zones: multi-tenancy, billing, permissions, audit logging?
- What does the zero state look like? The error state? The scale edge?
- What is the acceptance criterion — something a QA agent can verify without human eyes?

Resolve every open branch. Do not move to `/to-prd` while anything is still ambiguous.

---

## Rules

- One question at a time. Never ask two at once.
- Give your recommended answer before asking for theirs.
- Record decisions as you go — the PRD is a synthesis of this session, not a fresh start.
