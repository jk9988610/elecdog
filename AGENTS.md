# AGENTS.md

## Cursor Cloud specific instructions

ElecDog (电子狗) is a single-product repo: a browser-based artificial-life observation
console (vanilla ES-module JS, no framework/bundler) plus a set of headless Node.js
"field batch" simulation runners under `scripts/`. There is no backend server; the only
external dependency is an optional, hosted Supabase project used for cloud sync.

Requirements: Node.js >= 22 (already present in this environment) and npm. Dependencies
are installed by the startup update script (`npm install`).

Running the two development surfaces (both need `npm install` to have run):

- Web observation console: serve the repo root as a static site — `npx --yes serve . -l 3000`
  then open `http://localhost:3000/`. The app uses `<script type="module">`, so it must be
  served over HTTP (it will not work from `file://`). There is intentionally no
  `dev`/`start` npm script; serve ad-hoc. A `404 /favicon.ico` in the console is expected
  and harmless.
- Field-batch simulations: `npm run field:phase35` (or any other `field:phase*` script in
  `package.json`). These run the world engine headlessly and print a summary.

Gotchas:

- Some `field:*` scripts write/overwrite tracked report JSON under `docs/` (e.g.
  `docs/field-phase35-report.json`). After running a simulation for verification, revert
  the regenerated report (`git checkout -- <file>`) unless the report change is the intent.
- Adding `:cloud` (or `--cloud` / `FIELD_CLOUD=1`) to a field script uploads results to
  Supabase; committed defaults point at a shared hosted project. Optional — omit for local
  dev to avoid network calls.
- There is no test framework and no lint/formatter configured. The closest thing to tests
  are the `*:verify` npm scripts (e.g. `npm run field:phase125:verify`, `npm run codex:verify`),
  which validate simulation/data outputs via `node scripts/*-verify.mjs`.
- Android/Capacitor (`npm run cap:sync`, `apk:debug`) and OTA are optional and require a
  separately installed Android SDK; not needed for web or simulation development.
