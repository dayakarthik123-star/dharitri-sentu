# Dharitri Sentu — upgrade package notes

## Production-integrated design handoff

This package retains the full React/TypeScript application and Node.js API while keeping the cinematic forest/Assam imagery design in the integrated homepage (`src/features/marketplace/HomePage.tsx`, `public/assets/tea-garden-bg.jpg`) rather than replacing the app with a standalone HTML mockup. The marketplace, parcel explorer, due diligence, Trust Passport, discrepancy review, LandLocker, Setu boundary, AI endpoints and role-specific routes remain in the source tree.

## Added in this packaging pass

- Multi-stage `Dockerfile` that builds the React app and runs the Node API in a smaller Node 22 runtime image.
- `compose.yaml` with demo accounts disabled, persistent `/data`, loopback-only host binding, read-only container root filesystem, dropped Linux capabilities, and a basic API health check.
- `.env.production.example` and `docs/Deployment-Container.md` to make the production setup and its blockers explicit.
- `.dockerignore` to keep local dependencies, environment secrets, and runtime storage out of the build context.

## Verification in this pass

- `npm run test:api` passed both API smoke and rescan/security integration suites.
- `npm run lint` could not run after an `npm ci` attempt timed out; the interrupted install left incomplete type packages. No frontend build or browser test is claimed as passed in this pass.
- Container build is not claimed as passed because it requires a successful dependency install and registry access.

## Not a claim of production certification

The project is a production-oriented pilot/prototype. Synthetic records are not official land records; Setu, Gemini and any Assam land-record API require valid credentials, approved access, and live end-to-end tests. Complete the checklist in `docs/Release-Readiness.md` before handling real users or sensitive documents.

## Production hardening and access-scope update — 30 October 2026

- Production frontend builds now force server API mode; local browser-demo authentication is disabled.
- Demo accounts cannot authenticate when `NODE_ENV=production`, even if an environment flag is mistakenly enabled.
- New production databases initialise with empty application collections; existing databases are preserved and not destructively reset.
- Public listing visibility excludes legacy demo-published records.
- Reviewer visibility and review actions are restricted to records explicitly assigned by `assignedReviewerId` or `assignedReviewerEmail`.
- Reviewer document access is no longer blanket access: a reviewer needs an active owner-granted document share.
- Seller/buyer submissions cannot self-assign reviewer IDs.
- Removed visible demo-reset and demo-login affordances from the public/reviewer UI.
- Added `docs/Production-Access-Control.md` with the role matrix, enforced boundaries, limitations and deployment gates.

Verification: `node --check server/index.mjs`, `node scripts/api-smoke-test.mjs`, and `node scripts/api-rescan-test.mjs` passed. Full TypeScript/Vite build and frontend test suite were not run because dependency installation timed out in this environment. A separate platform-administrator role and reviewer-assignment UI remain outstanding; this is a production-hardening build, not a certified production service.
