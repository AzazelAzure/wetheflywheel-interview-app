# wetheflywheel-interview-app

A small, self-contained take-home exercise for evaluating **agentic AI engineering** practice: given a spec, use an AI coding agent (Claude Code, Cursor, or similar) to plan, implement, and verify a working app — not just to produce code that compiles.

This repo is intentionally standalone. It does not reference or depend on any other project. Everything a candidate needs is in this directory tree.

## Start here

1. [`design_docs/DESIGN.md`](design_docs/DESIGN.md) — the product spec: what to build.
2. [`governance/WORKFLOW.md`](governance/WORKFLOW.md) — how to build it: the planning/verification discipline we want demonstrated, not just the output.

## What's being evaluated

Not "did you produce a forecasting app" — plenty of agents can do that. We're looking at:

- Whether the candidate directs their agent to **plan before implementing** (a short design/plan artifact, not just prompt-and-accept).
- Whether ambiguous spec points get **surfaced as questions** rather than silently guessed.
- Whether the agent's own output gets **verified** (tests, manual run-through) before being called done.
- Code quality and correctness of the forecasting logic itself.

## Scope note

Stack choice (language, framework, CLI vs. web) is intentionally left open — see `design_docs/DESIGN.md` §Non-goals and §Open Choices. Pick what best demonstrates your workflow.
