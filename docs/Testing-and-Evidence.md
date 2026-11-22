# Testing and Verification Evidence

Date of this handoff: 2026-10-29.

## Commands that passed in the available worktree

- `npm run lint` — passed (`tsc --noEmit`).
- `node --check server/index.mjs` — passed.
- `node --check server/create-reviewer.mjs` — passed.
- `node --check scripts/api-smoke-test.mjs` — passed.
- `node --check scripts/api-rescan-test.mjs` — passed.
- `npm run test:api` — passed API smoke and rescan/security integration suites. Covered health/config status, bad password rejection, session auth, SHA-256 of actual uploaded bytes, AES-256-GCM encrypted storage, quarantine access controls, private file access, role checks, rescanning, sharing expiry/revocation paths and listing publication gates.
- Locale dictionary key parity — passed; `en`, `as`, and `hi` each contain 282 matching keys at this revision.
- Final ZIP integrity check — passed with `unzip -t`.
- Package hygiene check — no `.env`, SQLite runtime database/WAL/SHM, uploaded runtime files, or `node_modules` included in the final archive.

## Checks blocked in this execution environment

- `npm run build` runs the TypeScript compiler successfully, then Vite/Rollup fails before bundling because the pre-existing `node_modules` tree contains the macOS Rollup package while this execution container is Linux and `@rollup/rollup-linux-x64-gnu` is missing.
- `npm test` could not start for the same Rollup optional-dependency mismatch.
- An npm registry install attempt timed out. The delivered ZIP deliberately omits `node_modules`, so run `npm ci` on your target Mac; npm should install the correct macOS optional dependency from the lockfile. Then rerun the build and tests.
- Live Setu/DigiLocker and Gemini provider calls were not attempted because real credentials/callback configuration are not available to this environment. No live Assam government endpoint is configured.

## Limits of these checks

The API tests prove the tested backend logic in the local test environment; they are not a full end-to-end browser test, penetration test, load test, security audit or certification. Translation-key parity proves dictionary consistency, not that every legacy hardcoded English string across all pages has been translated. The fake scanner used in rescan tests validates fail-closed workflow logic only; configure and test a real ClamAV scanner before handling real files.
