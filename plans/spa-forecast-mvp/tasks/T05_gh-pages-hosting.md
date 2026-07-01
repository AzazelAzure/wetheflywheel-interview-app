# T05 — GitHub Pages hosting + README instructions

**Verification tier:** Manual run (visit published URL)

## Goal

The app is reachable at the repo's GitHub Pages URL with no build/Actions step, and the root `README.md` tells a stranger how to run it both locally and understand where it's hosted.

## Steps

1. Confirm `index.html` sits at the **repo root** (not in a subdirectory) — GitHub Pages "Deploy from branch" defaults to root or `/docs`; root is simpler and matches T01.
2. Enable GitHub Pages on the repo: Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/(root)`. This is a GitHub UI/API action — if `gh` CLI access permits (`gh api repos/AzazelAzure/wetheflywheel-interview-app/pages -X POST ...`), use it; otherwise flag as a manual one-click step for the human (HitM) to complete, since Pages activation is an account-level setting change outside a code diff.
3. Update root `README.md`:
   - **Run locally:** "Clone, then open `index.html` directly in a browser — no install required." Plus the `python3 -m http.server` alternative for anyone who hits local `file://` restrictions in their particular browser.
   - **Live demo:** the published Pages URL (`https://azazelazure.github.io/wetheflywheel-interview-app/`).
   - **Run tests:** the `node --test` command from T03.
4. Do not add a GitHub Actions workflow — there is nothing to build. If a future contributor adds a bundler, that's an explicit scope change, not part of this plan.

## Verification

- [ ] [Manual run] Visit the published Pages URL after enabling Pages and confirm the app loads and functions identically to the local `file://` run (T01/T04 checks).
- [ ] [Code audit] `README.md` accurately describes exactly how to run/test the app with no missing steps.
