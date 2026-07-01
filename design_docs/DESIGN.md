# Design Doc — Personal Net-Pay Forecaster

| Field | Value |
|---|---|
| status | draft |
| owner | (candidate) |
| created | 2026-07-02 |

## 1. Problem

Someone earning income under one pay structure (rate, cycle, tax rate) — and possibly paid in a different currency than the one they spend day-to-day in — wants a simple forecast of their **predicted net income** over time, expressed in their living currency.

## 2. Scope (MVP)

Build a small app (CLI, web, or API — candidate's choice) that:

1. Accepts income parameters (§3).
2. Computes predicted net pay per pay event (§4).
3. Projects a forecast across a date range (§5).
4. Converts each projected net amount into a second "living" currency (§6).
5. Outputs the forecast (§7).

## 3. Inputs

| Field | Type | Notes |
|---|---|---|
| `pay_cycle` | enum | `weekly`, `biweekly`, `monthly`, `annually`, `onetime` |
| `pay_rate_type` | enum | `hourly`, `salary`, `project` |
| `rate_value` | number | Meaning depends on `pay_rate_type` — see below |
| `hours_per_period` | number | Required only when `pay_rate_type = hourly`. Hours worked per pay cycle. |
| `tax_rate` | number (0–1 or 0–100, pick one and validate consistently) | User-entered flat rate. No bracket logic, no jurisdiction lookup — this is intentionally out of scope (see §8). |
| `pay_currency` | ISO 4217 code | Currency the income is paid in, e.g. `USD`. |
| `living_currency` | ISO 4217 code | Currency the user spends day-to-day in, e.g. `EUR`. May equal `pay_currency` (no-op conversion). |
| `fx_rate` | number | `1 pay_currency = fx_rate living_currency`. User-entered for MVP (see §6). |
| `forecast_start` / `forecast_end` | date | Range to project over. |

**`rate_value` semantics by `pay_rate_type`:**
- `hourly` → dollars per hour; gross per period = `rate_value * hours_per_period`.
- `salary` → **annual** gross salary; must be normalized to the selected `pay_cycle` (see §4).
- `project` → a flat gross amount for one deliverable; only valid with `pay_cycle = onetime`. Reject/flag other combinations rather than silently guessing.

## 4. Net-pay calculation (per pay event)

1. Compute gross for the period:
   - `hourly`: `rate_value * hours_per_period`
   - `salary`: `rate_value / periods_per_year(pay_cycle)`
   - `project`: `rate_value` (single event)
2. Apply flat tax: `net = gross * (1 - tax_rate)`
3. `periods_per_year` reference: weekly = 52, biweekly = 26, monthly = 12, annually = 1, onetime = 1 (single event, not annualized).

`salary` + `onetime` is a valid combination (e.g. a signing bonus modeled as salary-equivalent) — annualize per above, but only one event falls in range.

## 5. Forecast projection

Given `forecast_start`/`forecast_end`, generate the sequence of pay dates implied by `pay_cycle` (e.g. every 14 days for `biweekly`) and compute net pay (§4) at each. `onetime`/`project` produces exactly one event, dated at `forecast_start` (or a user-supplied pay date — candidate's choice, document it).

Output should include both **per-event net** and a **running cumulative total**.

## 6. Currency conversion

Each forecasted net amount (in `pay_currency`) is also expressed in `living_currency`:

`net_living = net_pay_currency * fx_rate`

**MVP:** `fx_rate` is user-entered (static for the whole forecast — no historical/projected rate drift). This is a deliberate simplification; do not build a live FX API integration for MVP.

**Stretch (optional, not required for a passing submission):** pull a live/daily rate from a public FX API and note in the forecast which rate/date was used. If attempted, the static user-entered rate must remain the default fallback.

## 7. Output

For each forecast run, produce:
- List of pay events: date, gross, tax withheld, net (pay currency), net (living currency).
- Cumulative net total by end of range, in both currencies.
- The `fx_rate` and `tax_rate` used, echoed back for transparency (these are user assumptions, not verified facts — the output should make that legible).

Format (JSON, table, simple UI — candidate's choice) is not prescribed.

## 8. Non-goals (explicitly out of scope for this exercise)

- Tax bracket / jurisdiction-aware tax calculation. Flat user-entered rate only.
- Multiple simultaneous income sources.
- Expense tracking, budgeting, or savings-goal modeling.
- Historical actuals / reconciliation against real pay stubs.
- Live bank or payroll integrations.
- Authentication, multi-user accounts, persistence beyond a single session (unless the candidate's chosen approach makes it free).

Do not build these. A candidate who scopes down to exactly this spec (and asks about anything genuinely ambiguous) is demonstrating the right judgment.

## 9. Open choices (deliberately left to the candidate)

- Tech stack / language / framework.
- CLI vs. web vs. API-only.
- Exact output format.
- Whether `tax_rate` is stored as a fraction or a percentage (just be internally consistent and validate input).

## 10. Acceptance criteria

- [ ] All five `pay_cycle` values produce correct period counts over a multi-month range.
- [ ] All three `pay_rate_type` values compute gross correctly, including salary annualization.
- [ ] Flat tax rate is applied and net is always ≤ gross.
- [ ] Currency conversion is applied consistently to every forecasted event.
- [ ] Invalid combinations (e.g. `project` + `weekly`) are rejected or flagged, not silently miscalculated.
- [ ] A short `WORKFLOW.md`-style plan/notes artifact exists showing the build was planned before implementation (see `governance/WORKFLOW.md`).
