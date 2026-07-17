---
labels: ready-for-agent
---

## Parent

[Issue 008: Plan tiers + shot tracking](./008-plan-tiers-shot-tracking.md) — the `ENTERPRISE` → `ULTIMATE` rename shipped in the backend but never propagated to the shared package, surfaced during a full-codebase audit on 2026-07-17.

## What to build

`packages/shared/src/schemas/enums.ts` still defines `PlanTier` as `{ FREE, PRO, ENTERPRISE }` — it never picked up the `ULTIMATE` rename that `app/models/organization.py` and migration `0004_plantier_ultimate.py` shipped (DOMAIN.md: "`ENTERPRISE` is a legacy value kept only for zero-downtime rollback... do not use it in new code"). Because both `apps/web` and `apps/extension` import `PlanTier` from `shared`, neither can reference `ULTIMATE` in TypeScript — which is why `apps/web/src/lib/pricing-plans.ts` still sets its top pricing tier to `PlanTier.ENTERPRISE`, and the pricing/billing page likely shows "Enterprise" to users instead of "Ultimate".

Add `ULTIMATE` to the shared `PlanTier` enum (keep `ENTERPRISE` present too, matching the backend's rollback-safety rationale — don't remove it here). Then update `pricing-plans.ts` (and any other lingering `PlanTier.ENTERPRISE` reference found via a repo-wide search across `apps/web` and `apps/extension`) to use `PlanTier.ULTIMATE`.

## Risk

`Normal` — no backend change (the rename already shipped there); this is a TS-only enum addition plus fixing the call sites that should have followed it. Blast radius is small — grep confirmed `pricing-plans.ts` is the only known lingering usage, but re-check at implementation time in case something new was added since the audit.

## Acceptance criteria

- [ ] `packages/shared/src/schemas/enums.ts`'s `PlanTier` includes `ULTIMATE`
- [ ] `apps/web/src/lib/pricing-plans.ts` uses `PlanTier.ULTIMATE` for its top tier, not `PlanTier.ENTERPRISE`
- [ ] A repo-wide search for `PlanTier.ENTERPRISE` across `apps/web` and `apps/extension` turns up no remaining non-legacy usages
- [ ] The pricing page renders "Ultimate" (not "Enterprise") for the top tier
- [ ] `npm run build` / `tsc` passes for `apps/web`, `apps/extension`, and `packages/shared`

## Blocked by

None — can start immediately.
