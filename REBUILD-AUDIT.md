# Dharitri Sentu rebuild audit

## Changes in this package

- Full-stack development launcher creates `.env` from `.env.example` if missing, warns when API mode is explicitly disabled, and reports service startup failures.
- Development defaults to API mode unless `VITE_API_MODE=false` is explicitly set. Production still requires `VITE_API_MODE=true`.
- Added `npm run doctor`, which checks configuration presence and callback shape without printing secret values.
- Added Windows launcher `RUN-DHARITRI-WINDOWS.bat`.
- Setu config accepts `DIGILOCKER_PRODUCT_INSTANCE_ID` as an alias in addition to `SETU_DIGILOCKER_PRODUCT_INSTANCE_ID`.
- Updated local setup docs and clarified that the Setu callback must be a public HTTPS URL. `localhost` is not reachable by Setu for the provider redirect.
- Preserved LandLocker and the existing app features.

## Checks run in this environment

- `node --check server/index.mjs` — passed.
- `node --check scripts/run-dev.mjs` — passed.
- `node --check scripts/doctor.mjs` — passed.
- `npm run test:api` — passed API smoke and document rescan/security integration tests.
- English, Assamese and Hindi JSON dictionaries parse and have identical key sets (293 each).
- `npm run lint` / production build could not be verified: the available `node_modules` directory is incomplete (TypeScript reports missing type definition packages). `npm ci` timed out in this environment. Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` on a networked machine before release.

## External integrations not certified by this package

- Setu credentials must be valid for the chosen sandbox/product instance; this package cannot correct an invalid secret. Use a registered, publicly reachable HTTPS callback.
- Gemini, SMTP and MapTiler keys must be valid and appropriately restricted.
- ClamAV must exist inside the runtime and pass a real integration test before uploads can be considered clean. Otherwise documents remain quarantined.
- No authorised Assam land-record API is configured by default; seeded records are synthetic demonstration data.
- This is a production-oriented pilot build, not a certified government service or security-audited release.

## Security action required

Credentials pasted into chat must be considered exposed. Rotate Setu credentials, Gemini key and Gmail app password. Generate a new document encryption key only after backing up and planning migration for any data encrypted under the old key; changing it without re-encrypting existing files can make them unreadable. Never include `.env` in a shared ZIP or commit it to version control.
