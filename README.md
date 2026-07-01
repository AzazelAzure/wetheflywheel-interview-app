# Net Pay Forecaster

A single-page web app that forecasts predicted net income over a date range, with flat-tax and currency-conversion support. Built as a take-home exercise demonstrating agentic AI engineering workflow.

## Run locally

No install or build step required.

1. Clone this repo.
2. Open `index.html` directly in a browser (double-click or `file://` URL).

If your browser restricts local file scripts, serve the repo root instead:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Live demo

https://azazelazure.github.io/wetheflywheel-interview-app/

## Run tests

Requires Node.js 18+ (uses the built-in test runner — no npm install needed):

```bash
node --test test/
```

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | App entry — loads vendored React, Babel, Decimal.js, and the app |
| `app.js` | React UI (JSX transformed in-browser by Babel Standalone) |
| `calc.js` | Pure calculation engine — all money math via Decimal.js |
| `vendor/` | Vendored UMD builds (see `vendor/VERSIONS.md`) |
| `test/calc.test.js` | Unit tests for the calculation engine |
| `design_docs/DESIGN.md` | Product spec |
| `plans/spa-forecast-mvp/` | Build plan and task breakdown |

## Spec and workflow

- Product spec: [`design_docs/DESIGN.md`](design_docs/DESIGN.md)
- Build plan: [`plans/spa-forecast-mvp/README.md`](plans/spa-forecast-mvp/README.md)
- Workflow discipline: [`governance/WORKFLOW.md`](governance/WORKFLOW.md)
