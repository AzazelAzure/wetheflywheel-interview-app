---
plan_id: PLAN_SPA_FORECAST_MVP
status: ready
owner: pproctor
created: 2026-07-02
updated: 2026-07-02
executor: Cursor (this repo has no build tooling of its own — plain HTML/JS)
spec: ../../design_docs/DESIGN.md
workflow: ../../governance/WORKFLOW.md
---

# Plan — Single-Page Forecast Web App (MVP)

## 1. Objective

Build the app specified in [`design_docs/DESIGN.md`](../../design_docs/DESIGN.md) as a **single-page static web app** that:

- Runs by opening `index.html` directly in a browser (`file://`) — no install, no build step.
- Also hosts as-is on **GitHub Pages** from the repo root with zero config beyond enabling Pages.
- Uses **React** for the UI.
- Uses **decimal-safe arithmetic** for every money-bearing calculation — no native JS floating point math on currency values, ever.

This satisfies [`governance/WORKFLOW.md`](../../governance/WORKFLOW.md) §1 (plan before implementing) — this document *is* that plan. Execute tasks in order; each has its own verification tier per WORKFLOW.md §3.

## 2. Locked decisions (do not re-litigate — these resolve ambiguity DESIGN.md left open)

| Decision | Choice | Why |
|---|---|---|
| Stack | React 18 (UMD) + Babel Standalone (in-browser JSX) | Zero build step; satisfies "click and run" + GH Pages hosting with no Actions/CI needed. |
| Dependency delivery | **Vendor the UMD/minified builds into `vendor/`** (React, ReactDOM, Babel Standalone, Decimal.js) — commit them, don't reference a CDN in shipped `index.html` | True "works out of the box": no network dependency once cloned, no CDN-outage risk on GH Pages. |
| Decimal math | [decimal.js](https://github.com/MikeMcl/decimal.js/) — every money/rate calculation goes through `Decimal` instances, converted to primitive `Number`/string only at final display | Hand-rolled cents-integer math breaks down with fractional hourly rates and FX multiplication; a maintained arbitrary-precision decimal library is the safer choice here. |
| `tax_rate` UI contract | User enters/sees a **percentage** (e.g. `22` = 22%). Internally convert once — `Decimal(taxRateInput).div(100)` — at the calculation boundary. Never store two parallel representations. | Matches the task instruction directly; prevents fraction/percentage ambiguity bugs. |
| Rounding | Keep full `Decimal` precision through every intermediate step (including the cumulative running total). Round to display precision (**2dp for money, 6dp for FX rate**) only at the final render/output step, using one documented rounding mode (`Decimal.ROUND_HALF_UP`). | Rounding per-line-item and then summing compounds error; round once, at the boundary. |
| Persistence | None. In-memory state only, per DESIGN.md §8 non-goals. | Matches spec. |
| Hosting | GitHub Pages serving `main` branch root (no `/docs`, no Actions build) | Repo root already *is* the deployable artifact — no build output to publish. |

## 3. Tasks

| ID | Title | Verification tier | File |
|---|---|---|---|
| T01 | Vendor static dependencies + app shell | Manual run (open in browser, console clean) | [tasks/T01_app-shell.md](tasks/T01_app-shell.md) |
| T02 | Calculation engine (pure JS, decimal-safe) | Automated test | [tasks/T02_calc-engine.md](tasks/T02_calc-engine.md) |
| T03 | Unit tests for calculation engine | Automated test (this task *is* the tests) | [tasks/T03_calc-engine-tests.md](tasks/T03_calc-engine-tests.md) |
| T04 | UI: input form + forecast output | Manual run | [tasks/T04_ui-form-output.md](tasks/T04_ui-form-output.md) |
| T05 | GitHub Pages hosting + README instructions | Manual run (visit published URL) | [tasks/T05_gh-pages-hosting.md](tasks/T05_gh-pages-hosting.md) |
| T06 | Final acceptance pass against DESIGN.md §10 | Code audit + manual run | [tasks/T06_acceptance-pass.md](tasks/T06_acceptance-pass.md) |

Do tasks in order — T02/T03 (engine + tests) should be solid *before* T04 wires them into UI, so calculation bugs aren't debugged through the DOM.

## 4. Definition of done

- All six tasks checked off with their stated verification tier met (evidence noted inline in each task file, per `governance/WORKFLOW.md` §3).
- `index.html` opens correctly via plain double-click / `file://` **and** works when served (e.g. `python3 -m http.server`).
- No native floating-point arithmetic (`+`, `-`, `*`, `/` on raw `Number`) touches a money or FX value anywhere in the source — grep for it as part of T06.
- Repo pushed to `main`; GitHub Pages live at the published URL.

## 5. Explicitly not in this plan

Everything in DESIGN.md §8 (non-goals) stays out: tax brackets, multi-income, budgeting, persistence, live FX API (static user-entered rate only, per DESIGN.md §6 MVP), auth. If an executor is tempted to add any of these "while in there," stop — that's scope creep against a locked spec.
