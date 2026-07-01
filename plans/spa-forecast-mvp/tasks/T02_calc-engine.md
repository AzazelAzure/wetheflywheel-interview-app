# T02 — Calculation engine (pure JS, decimal-safe)

**Verification tier:** Automated test (see T03)

## Goal

A framework-free module (`calc.js` or `calc/` at repo root — not inside `app.js`) implementing [`design_docs/DESIGN.md`](../../../design_docs/DESIGN.md) §3–§7, so it can be unit tested independently of the UI (T03) and imported by the UI (T04).

## Required functions (names indicative, not mandatory)

All money/rate parameters and return values must be `Decimal` instances (or plain numeric strings immediately wrapped in `Decimal` on entry) — **never** raw JS `Number` arithmetic on a money value.

1. `periodsPerYear(payCycle)` → integer lookup per DESIGN.md §4.3 (`weekly`=52, `biweekly`=26, `monthly`=12, `annually`=1, `onetime`=1).
2. `computeGross({ payRateType, rateValue, hoursPerPeriod, payCycle })` → `Decimal`, per DESIGN.md §4.1. Must **reject** (throw or return a typed error, executor's choice — document it) invalid combinations, e.g. `payRateType: 'project'` with `payCycle !== 'onetime'`, per DESIGN.md §3 and §10.
3. `computeNet(gross, taxRatePercent)` → `Decimal`. Converts the percentage to a fraction internally (`Decimal(taxRatePercent).div(100)`) — caller always passes the percentage as entered by the user (e.g. `22`, not `0.22`). `net = gross.times(Decimal(1).minus(fraction))`.
4. `generatePayDates({ payCycle, forecastStart, forecastEnd })` → array of dates. `onetime`/`project` → exactly one date (`forecastStart`, or a user-supplied pay date if the UI collects one — decide in T04 and keep consistent). Other cycles → every date at the cycle's interval within `[forecastStart, forecastEnd]` inclusive.
5. `buildForecast({ ...all input fields... })` → array of `{ date, gross: Decimal, net: Decimal, cumulativeNet: Decimal }`, computed by walking `generatePayDates` output and calling `computeGross`/`computeNet` per event, accumulating the running total **as a `Decimal` running sum** (do not round between additions — see plan README §2 rounding rule).
6. `convertToLivingCurrency(amount, fxRate)` → `Decimal` — `amount.times(fxRate)`. Applied per forecast event, not just to the total.
7. A single formatting helper, e.g. `formatMoney(decimalValue)` → string, used only at render time (T04) — `.toFixed(2)` (or `.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString()`), never earlier in the pipeline.

## Verification

- [ ] [Code audit] Grep the new module for bare `+`, `-`, `*`, `/` operators applied to money-bearing variables — there should be none; everything routes through `Decimal` methods (`.plus`, `.minus`, `.times`, `.div`).
- [ ] [Automated test] Deferred to T03 — this task is not "done" until T03's tests pass against it.
