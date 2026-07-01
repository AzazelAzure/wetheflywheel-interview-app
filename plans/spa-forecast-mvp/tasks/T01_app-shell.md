# T01 — Vendor static dependencies + app shell

**Verification tier:** Manual run

## Goal

A repo-root `index.html` that loads a React app with zero build step and zero runtime network dependency.

## Steps

1. Create `vendor/` at repo root. Download (do not `npm install`) pinned, current-stable **minified UMD/browser builds** and commit them:
   - `react.production.min.js`
   - `react-dom.production.min.js`
   - `babel.min.js` (Babel Standalone — enables in-browser JSX transform)
   - `decimal.min.js` (decimal.js)
   Record the exact version of each in a short comment at the top of this file or in `vendor/VERSIONS.md`.
2. Create `index.html` at repo root:
   - `<script>` tags (classic, non-`module`, so `file://` works without CORS issues) loading the four vendored files in dependency order.
   - A `<div id="root"></div>`.
   - A `<script type="text/babel" src="app.js"></script>` (or inline) as the app entry point — Babel Standalone transforms JSX in-browser.
3. Create `app.js` with a placeholder component (e.g. renders a heading) to prove the pipeline works before building real UI in T04.
4. Add a minimal `style.css`, linked from `index.html`, for basic legible layout (not a design system — a form and a table need to be readable, nothing more).

## Verification

- [ ] [Manual run] Double-click `index.html` (`file://` URL) in a browser — placeholder renders, **zero console errors**, **zero network requests** (check DevTools Network tab — everything should resolve from disk).
- [ ] [Manual run] Serve via `python3 -m http.server` (or equivalent) from repo root and confirm it also renders identically over `http://localhost`.
