# T04 — UI: input form + forecast output

**Verification tier:** Manual run

## Goal

Wire the T02 calculation engine into a React UI matching DESIGN.md §3 (inputs) and §7 (output), inside `app.js` (built on the T01 shell).

## Input form (DESIGN.md §3)

- `pay_cycle` — select: `weekly` / `biweekly` / `monthly` / `annually` / `onetime`.
- `pay_rate_type` — select: `hourly` / `salary` / `project`.
- `rate_value` — numeric input, label changes contextually based on `pay_rate_type` (e.g. "Hourly rate", "Annual salary", "Project amount").
- `hours_per_period` — numeric input, **only rendered/required when `pay_rate_type === 'hourly'`**.
- `tax_rate` — numeric input, **labeled and displayed as a percentage** (e.g. suffix `%`, helper text "enter as a percentage, e.g. 22 for 22%"). Passed to the engine exactly as entered — conversion to a fraction happens inside `calc.js`, not in the UI.
- `pay_currency` / `living_currency` — text or select (ISO 4217 codes; a hardcoded short list, e.g. USD/EUR/GBP/CAD/JPY, is enough for MVP — full ISO list is not required).
- `fx_rate` — numeric input, with helper text clarifying direction: "1 {pay_currency} = fx_rate {living_currency}".
- `forecast_start` / `forecast_end` — date inputs.

Client-side validation before calling the engine: required fields present, numeric fields actually numeric and non-negative, and the `project` + non-`onetime` combination blocked with a clear inline message (mirrors the engine-level rejection in T02 — belt and suspenders, but the UI message is what a user actually sees).

## Output (DESIGN.md §7)

- Table of pay events: date, gross, tax withheld (`gross - net`), net (pay currency), net (living currency).
- Cumulative net total row/section, in both currencies, computed from the **unrounded** running `Decimal` total (round only for display — see plan README §2).
- Echo the `tax_rate` (as the percentage the user entered) and `fx_rate` used, visibly near the output — DESIGN.md §7 requires this transparency.
- All displayed money values formatted via the single `formatMoney` helper from T02 (2dp), FX rate displayed at 6dp if shown raw.

## Verification

- [ ] [Manual run] For each of the 5 `pay_cycle` values × representative `pay_rate_type` combinations, enter inputs in the running app and confirm the rendered table matches hand-calculated expectations (reuse the T03 test cases as the source of expected values — don't invent new ones).
- [ ] [Manual run] Trigger the `project` + non-`onetime` invalid combination in the UI and confirm it's blocked with a clear message, not a crash or silent wrong output.
- [ ] [Manual run] Confirm the tax rate and FX rate are visibly echoed in the output exactly as entered.
