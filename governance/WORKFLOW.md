# Workflow — plan, build, verify

This is the discipline we want your agentic tooling to demonstrate on this exercise. It's deliberately lightweight — a few artifacts, not a heavyweight process.

## 1. Plan before implementing

Before writing code, produce a short `PLAN.md` (in this `governance/` directory or repo root — your choice) covering:

- Your read of the spec in `design_docs/DESIGN.md`, in your own words.
- Any ambiguous or underspecified points, and how you resolved them (or questions you'd ask a stakeholder if this weren't a take-home).
- The stack/approach you're choosing and why.
- A rough task breakdown (a handful of steps is enough — this is not a multi-week project).

If your agent starts generating code before this exists, stop it and back up. The plan is part of what's being evaluated, not overhead around it.

## 2. Build in small, checkable increments

Prefer several small, verifiable steps over one large generation pass. Each step should be something you can actually check (run it, test it, read the diff) before moving to the next.

## 3. Verify before calling it done

Every acceptance criterion in `design_docs/DESIGN.md` §10 needs one of:

| Tier | What counts | Use for |
|---|---|---|
| **Code audit** | You (or your agent) read the logic and confirm it's correct by inspection. | Simple, low-risk logic (e.g. enum validation) |
| **Automated test** | A test exists and passes, covering the case. | Calculation logic (§4–§6) — this should be most of your criteria |
| **Manual run** | You actually ran the app with real inputs and checked the output matches hand-calculated expectations for at least one non-trivial case per `pay_cycle`/`pay_rate_type` combination. | End-to-end forecast output (§7) |

Do not mark something done on the strength of "the code looks right" alone for anything touching money math — run it.

## 4. Document what you built

A short `CHANGELOG.md` or final section of `PLAN.md` noting what shipped, what was deliberately left out (tie back to `design_docs/DESIGN.md` §8 Non-goals), and any known limitations. Keep it to a few bullets — this mirrors real handoff hygiene, not a report.

## Definition of done

- All §10 acceptance criteria in `design_docs/DESIGN.md` are met and verified per §3 above.
- `PLAN.md` exists and reads like it was written *before* the implementation, not reverse-engineered after.
- No scope creep into §8 Non-goals.
