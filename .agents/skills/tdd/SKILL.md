---
name: tdd
description: Implement a vertical slice using red-green-refactor TDD in a single, fresh context session. Use when an agent picks up a ready-for-agent issue, when the user wants to build with TDD, or when running the AFK implementation loop. One session, one issue, one fresh context — always.
---

# TDD — Red Green Refactor

Implement one vertical slice, one behaviour at a time. Every session is fresh context, one issue, no carryover.

---

## Non-Negotiables

**One issue per session.** Never accumulate context across issues. Finish, commit, close, end the session.

**Test behaviour, not implementation.** Tests exercise public interfaces only. They survive internal refactors. A test that breaks because you renamed a private function was testing the wrong thing.

**Never delete a failing test.** A test that won't pass is telling you the design is wrong. Redesign — don't delete. A deleted test is a silent regression.

**Never write all tests first.** That is horizontal slicing. It produces tests that verify imagined behaviour, not real behaviour. One test, make it pass, write the next.

---

## Setup — Before Writing Any Code

1. Read the full issue: body, acceptance criteria, agent brief, risk classification
2. Read `DOMAIN.md` and `CONTEXT.md` — all test names, variable names, and interface vocabulary must match the project's domain language
3. Read the relevant ADRs from `docs/adr/` — never contradict an accepted ADR
4. Apply the risk classification:
    - `Migration` — run the migration inside a transaction; verify rollback before anything else
    - `Billing` — wrap the entire slice behind a feature flag; confirm it defaults to off
    - `Isolation` — write a tenant isolation assertion for every new query before other tests
5. If anything in the issue is ambiguous, raise a HITL checkpoint. Do not guess. Do not proceed on assumptions.

---

## The Loop

For each behaviour in the acceptance criteria:

```
RED    Write one failing test through the public interface.
       Run. Confirm it fails for the right reason — not a compile error,
       not a wrong import. The right reason.

GREEN  Write the minimal code to make it pass.
       No speculative features. No pre-emptive abstractions.
       Run. Confirm only this test changed from red to green.

CHECK  Is the total test count strictly higher than before this cycle?
       If not — stop. Something was deleted or skipped. Investigate.
```

After all acceptance criteria are green:

```
REFACTOR  Extract duplication. Deepen shallow modules.
          Apply SOLID where it genuinely reduces complexity — not as ritual.
          Run tests after every refactor step.
          Never refactor while red.
```

---

## Cycle Checklist

Before committing:

- [ ] Test describes observable behaviour, not an implementation detail
- [ ] Test uses only the public interface
- [ ] Test would survive a complete internal rewrite of the module
- [ ] Code written is the minimum required by this test
- [ ] No speculative code added
- [ ] Total test count is strictly higher than before this cycle

---

## Commit and Close

When all acceptance criteria are green and the refactor pass is complete:

1. Run the full test suite — not just the new tests. All must pass.
2. Commit: `feat: <domain-vocabulary description> (closes #<issue>)`
3. Push the branch and open a PR.
4. Apply `ready-for-review` to the issue.
5. End the session. Do not start the next issue in this context.

---

## When a Test Won't Pass

- Re-read the acceptance criterion. Is the test testing the right behaviour?
- Is the interface design wrong? A test that's genuinely hard to satisfy usually means the public interface needs rethinking, not that the test needs weakening.
- Raise a HITL checkpoint. Never delete, skip, comment out, or weaken a failing test.
