# resumio

A minimal Turborepo starter with a FastAPI backend and a Next frontend.

## Structure

```
resumio/
├── apps/
│   ├── api/          — FastAPI backend (port 8000)
│   └── web/          — Next frontend (port 3000)
├── package.json      — workspace root
├── turbo.json        — Turborepo orchestration
├── docker-compose.yml
├── .env.example
├── .agents/           — AI agent skills and context
├── AGENTS.md          — agent entry point with key facts
├── CONTEXT.md         — stack, invariants, patterns
└── DOMAIN.md          — domain glossary
```

## Quick start

```bash
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend:  http://localhost:8000

## AI Workflow

This project ships with AI agent skills in `.agents/skills/` that codify development workflows. When working with an AI coding agent (e.g. Claude Code, Cursor), the agent reads these files to understand conventions, terminology, and processes.

### Context files (read by agents at session start)

| File | Purpose |
| ---- | ------- |
| `AGENTS.md` | Project facts, commands, setup steps |
| `CONTEXT.md` | Stack, invariants, code patterns |
| `DOMAIN.md` | Domain glossary — terms agents must use consistently |

### Skills (invoked by agents for specific tasks)

| Skill | When to use |
| ----- | ----------- |
| `init` | Bootstrap or regenerate context files from codebase + DB schema |
| `improve-skill` | Retrospective after 3–5 features — update skills and context |
| `grill-me` | Stress-test a plan against the domain model |
| `system-design` | Explore architecture before writing a PRD |
| `tdd` | Red-green-refactor loop |
| `to-prd` | Turn conversation into a product requirements doc |
| `to-issues` | Break a plan into vertical-slice issues |
| `triage` | Review incoming bugs and feature requests |

### Typical session flow

1. Agent reads `AGENTS.md`, `CONTEXT.md`, `DOMAIN.md` at session start
2. For new features: run `grill-me` → `system-design` → `to-prd` → `to-issues`
3. For bugs: run `triage` → `diagnose`
4. After shipping 3–5 features: run `improve-skill` to keep docs fresh
5. If context files are stale or you're migrating an existing project: run `init`

## Setup

1. `npm install` at root
2. `apps/api`: copy `.env.example` to `.env`, fill secrets
3. `apps/web`: copy `.env.example` to `.env.local`
4. Start infrastructure: `docker compose up -d` from `apps/api/`
5. Run database migrations per backend docs
6. `npm run dev`
