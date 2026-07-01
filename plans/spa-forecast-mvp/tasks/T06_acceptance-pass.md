# T06 — Final acceptance pass

**Verification tier:** Code audit + manual run

## Goal

Close the loop against [`design_docs/DESIGN.md`](../../../design_docs/DESIGN.md) §10 and this plan's definition of done (README.md §4) before calling the build finished.

## Checklist

- [ ] Re-run every DESIGN.md §10 acceptance criterion explicitly and record pass/fail (reuse T03/T04 evidence — don't re-derive from scratch).
- [ ] [Code audit] Repo-wide grep for bare arithmetic operators (`+`, `-`, `*`, `/`) touching anything derived from `rate_value`, `gross`, `net`, `tax_rate`, `fx_rate`, or cumulative totals — confirm zero hits outside `calc.js`'s `Decimal` calls and pure UI concerns (e.g. array indexing, which is fine).
- [ ] [Manual run] `index.html` opens via plain double-click with zero console errors and zero network requests (re-check — T01's check, but re-verify nothing in T04/T05 introduced a CDN reference or other network dependency).
- [ ] [Manual run] Published GitHub Pages URL matches local behavior exactly.
- [ ] [Code audit] Nothing from DESIGN.md §8 (non-goals) crept in — no tax brackets, no multi-income, no persistence, no live FX API call, no auth.
- [ ] Update this plan's `README.md` metadata header `status: ready` → `status: completed`, `updated:` to the completion date.
- [ ] Add a short entry to a root `CHANGELOG.md` (create if absent) noting the MVP shipped, per `governance/WORKFLOW.md` §4.

## Verification

- [ ] [Code audit] All boxes above checked, with evidence (test output, screenshot, or explicit note) attached inline in this file before marking the plan `completed`.
