---
name: improve-skill
description: Review and update skills and context files after shipping features. Use after every 3-5 merged PRs, when a skill produced unexpected output, when a HITL checkpoint revealed a wrong assumption, or when a new pattern or domain term emerged that isn't captured anywhere. Skills are living documentation — they get PRs like code.
---

# Improve Skill

Skills rot. Run this retrospective after every three to five merged features and update anything that no longer reflects how the team actually works.

---

## When to Run

- 3–5 features have merged since the last retrospective
- An agent produced output the skill didn't anticipate and shouldn't have
- A HITL checkpoint was triggered by an ambiguity a better skill would have resolved
- A new pattern was adopted that isn't in `CONTEXT.md`
- A domain term was coined or renamed during a grill session but wasn't recorded in `DOMAIN.md`
- An ADR was written but the relevant skills don't reference it

---

## Process

### 1. Collect evidence

Read the last 3–5 merged PRs. For each, note:

- Which skills ran during this feature's development?
- Did the agent produce anything unexpected or require human correction?
- Did a HITL checkpoint fire on ambiguity that could have been resolved upfront?
- Did a new domain term, pattern, or invariant emerge?

### 2. Review affected skills

For each skill that ran:

- Does the description still accurately capture when to trigger it?
- Does any step produce output the codebase no longer wants?
- Is there a missing step that would have prevented a human correction?
- Is there a step that adds friction without value?

### 3. Review context files

**`DOMAIN.md`**

- New entities, terms, or relationships from recent features?
- Any definition now inaccurate or incomplete?
- Do all agent-facing names — table names, route names, UI labels — match the glossary?

**`CONTEXT.md`**

- New invariants the agent must respect?
- New patterns to follow?
- Any pattern that has been deprecated or replaced?

### 4. Draft and confirm changes

For each file that needs updating:

- Show the proposed change as a before/after in the conversation
- Cite the evidence — the PR, the unexpected output, the new decision
- Ask for confirmation before writing anything to disk

### 5. Apply and commit

```
chore: update <skill-or-file> — <what changed in one line>

Evidence: <PR link or brief description>
```

### 6. Record the retrospective

Append to `docs/skill-retro.md`:

```markdown
## <YYYY-MM-DD>

**PRs reviewed:** #n, #n, #n

**Changes made:**

- `<file>`: <what changed and why>

**No changes needed:**

- `<skill>`: <why it held up>

**Watching next batch:**

- <anything unresolved to look out for>
```

This is the audit trail. Future grill sessions and new team members can read it to understand why the workflow evolved.
