# T03 — Unit tests for the calculation engine

**Verification tier:** Automated test

## Goal

Automated coverage for every DESIGN.md §10 acceptance criterion that touches the calculation engine (T02), so correctness doesn't rest on eyeballing the UI.

## Approach

The shipped app has no build step — keep it that way. Tests are a **dev-only** concern and may use Node.js directly:

- `node --test` (Node's built-in test runner, available Node 18+, zero dependencies) with the built-in `assert` module — **no test framework install required**.
- If the calc engine module (T02) is written as a plain ES module or CommonJS module (not wrapped in browser-only globals), it can be `require`/`import`ed directly from a Node test file. Keep T02's module Node-and-browser-compatible (no `window`/`document` references in `calc.js`) so this works without duplicating logic.
- decimal.js is already vendored (T01) — reference the vendored file from the test, or add it as a Node `devDependency` only if strictly needed (a `package.json` used *solely* for `npm test` is fine; it must not be required to run/view the app itself).

## Required test cases (minimum — map directly to DESIGN.md §10)

1. **Pay cycle period counts** — for a fixed multi-month `forecast_start`/`forecast_end` range, assert `generatePayDates` returns the correct count for each of `weekly`, `biweekly`, `monthly`, `annually`, `onetime`.
2. **Gross by pay rate type**:
   - `hourly`: rate × hours matches hand-calculated expectation, including a fractional-hours case (e.g. 7.25 hours) to stress decimal precision.
   - `salary`: annual salary correctly divided by `periodsPerYear(payCycle)` for at least two different cycles.
   - `project`: flat amount passes through unchanged; combining `project` with a non-`onetime` cycle is rejected/flagged (per T02 §2 item 2).
3. **Tax application** — net is always `<=` gross for any tax rate `> 0`; a `0%` tax rate returns `net === gross`; percentage input (e.g. `22`) is *not* accidentally treated as a fraction (i.e. verify it's not computing `net = gross * (1 - 22)`, which would go negative — this is the exact bug class the percentage/fraction boundary invites).
4. **Currency conversion** — `convertToLivingCurrency` is linear and applied per-event; `fxRate = 1` is a no-op; spot-check one non-trivial rate (e.g. `0.92`) against hand math.
5. **Decimal precision / no float drift** — construct a case using inputs known to produce floating-point error under naive `Number` math (e.g. repeated `0.1`-scale additions across many pay periods, such as a `weekly` forecast over a full year — 52 additions) and assert the cumulative total is *exact* to the cent, not off by fractions of a cent. This is the test that actually proves the "remove floating point errors" requirement, not just an assertion of style.
6. **Invalid input handling** — malformed/out-of-range inputs (negative rate, `hoursPerPeriod` missing for `hourly`, unsupported enum value) produce a defined error path, not a silent `NaN`/garbage result.

## Verification

- [ ] [Automated test] `node --test` (or documented equivalent) passes, 0 failures, covering all six cases above.
- [ ] [Manual run] Confirm test run requires no step beyond what's documented in the repo's root README (e.g. `node --test test/`) — no hidden setup.
