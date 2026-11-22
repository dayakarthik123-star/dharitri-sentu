# Release readiness and verification (2026-10-29)

## What is included

- React/TypeScript application and same-origin Node.js API.
- Buyer, seller and restricted official-reviewer routes.
- Marketplace, interactive parcel map, unit converter, Price Explorer, virtual tours, Trust Passport, discrepancy cases, due diligence, LandLocker, Setu DigiLocker consent/document flows, and Gemini-backed AI endpoints.
- English, Assamese and Hindi JSON dictionaries, shared language preferences, profile/settings, and a SIGORA-style navigation drawer.
- Server-side authentication/roles, SQLite persistence, encrypted document storage, SHA-256 byte hashing, quarantine, scanner integration boundary, permission-checked sharing and audit history.

## Verification actually run in this environment

- `npm run lint` — passed (`tsc --noEmit`).
- `node --check server/index.mjs` — passed.
- `node --check server/create-reviewer.mjs` — passed.
- `node --check scripts/api-smoke-test.mjs` — passed.
- `node --check scripts/api-rescan-test.mjs` — passed.
- `npm run test:api` — passed both API smoke and rescan/security integration suites.
- Translation JSON parity — passed; English, Assamese and Hindi dictionaries each contain 282 keys at this revision.
- `npm run build` — blocked in this container because the supplied `node_modules` tree contains the macOS Rollup native package but the execution container is Linux and `@rollup/rollup-linux-x64-gnu` is absent. The npm registry retry timed out. The delivery ZIP deliberately excludes `node_modules`; run `npm ci` on the target machine, then repeat the build.
- `npm test` — could not start for the same missing Rollup platform-specific optional dependency. This is an environment/dependency-install blocker, not a passing test.

## External prerequisites before a real public launch

1. Use the real Setu Client ID, Client Secret and Product Instance ID; register/configure a reachable HTTPS callback; test consent, status, document catalogue, actual fetch and revoke with the provider sandbox. Issuer/document availability is not assumed.
2. Configure `GEMINI_API_KEY` server-side and verify a real request, quota, selected model, privacy settings and user consent before analyzing personal documents.
3. Configure a stable `DOCUMENT_ENCRYPTION_KEY`, real ClamAV scanner, secure HTTPS origin, restricted `ALLOWED_ORIGINS`, durable storage and backup/restore procedures.
4. Obtain authorised Assam land-record data access or continue using official-document upload and clearly labelled synthetic fixtures. No official Assam API key/endpoint is bundled.
5. Finish native-speaker/legal-term review of Assamese and Hindi translations; dictionary key parity is not proof that every visible English string across every legacy page has been translated.
6. Run production build, unit tests, browser end-to-end tests, deployment smoke tests, security review, and privacy/legal review on the deployment target.

## Honest status

This is a production-oriented full-stack pilot/prototype source, not a certified land registry, government-endorsed service, legal title verifier, or security-audited production system. The seeded land records are synthetic. Do not launch to real users with sensitive documents until the above prerequisites are completed and verified.


## Production access-control update (30 October 2026)

See `Production-Access-Control.md` for the enforced access boundaries and remaining deployment gates. This source update disables demo authentication in production, starts new production state empty, removes blanket reviewer document access, and scopes reviewer visibility/actions to explicitly assigned records. A separate administrator role and assignment UI are still outstanding; do not label this build fully production-certified.
