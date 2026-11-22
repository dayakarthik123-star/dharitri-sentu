# Dharitri Sentu — Assam Land Marketplace & LandLocker

**Find Land. Compare Evidence. Share Documents with Consent.**

Dharitri Sentu is a React/TypeScript application with a Node.js API backend. It includes a demo marketplace and map, parcel discrepancy workflows, a private document workspace (LandLocker), seller photo uploads, reviewer actions, consent-managed document sharing, and adapter boundaries for approved land-record and DigiLocker integrations.

> **Data integrity:** The seeded parcels, owner names, land identifiers, prices, reference polygons, risk attributes, and review outcomes are synthetic demonstration data. The app is not affiliated with or endorsed by the Government of Assam. A working satellite basemap is not a cadastral record and does not prove title, ownership, boundaries, encumbrances, or legal validity.

## What is implemented

- **React UI + same-origin Node API** for local development and production static serving.
- **SQLite persistence** for accounts, sessions, state, uploads, reviewer actions, sharing grants, and audit entries.
- **Password authentication** using per-password salts and scrypt hashes; HTTP-only session cookie; login throttling; API-side role checks.
- **Real document and image uploads** with file signature checks, SHA-256 of uploaded bytes, AES-256-GCM encryption at rest, private storage, and quarantine until a configured ClamAV scan passes.
- **Server-enforced document sharing** with registered recipients, expiry, and revocation. Content requests re-check access on the server.
- **Reviewer workflow** that cannot approve sample metadata as a real file, and cannot publish a listing until its photos have passed the configured scan.
- **Land-record connector boundary** that can call a configured, authorised HTTPS JSON endpoint. No government endpoint or credential is bundled.
- **Setu by Pine Labs DigiLocker flow** using the documented Setu sandbox/production base URL and the `x-client-id`, `x-client-secret`, and `x-product-instance-id` headers. The server creates a request, sends the user to Setu-hosted sign-in/consent, checks the callback against the stored request ID and rechecks status with Setu before marking consent active. It supports document catalogue retrieval and a consented document-fetch endpoint, then validates downloaded file type, hashes actual bytes, scans, encrypts, and imports the file into LandLocker. Live behaviour must still be tested with your Setu account, registered HTTPS callback and available issuer catalogue.
- **Map fallback** when the MapTiler key is missing or is a placeholder. Use a real provider key only after restricting it to your permitted origins and respecting that provider's terms.
- **Synthetic-data banners and source labels** so demo data is not presented as officially verified.

## Requirements

- **Node.js 22.16+ recommended** (the API uses the built-in `node:sqlite` module; use a currently supported Node 22 LTS release).
- npm 10+.
- For uploads to become accessible, install ClamAV and configure the full path to `clamscan`. Without a successful scan, files remain encrypted and quarantined by design.
- For a real deployment, provide a stable 32-byte encryption key and persist the SQLite database and encrypted storage outside ephemeral deployment disks.

## Run locally

```bash
# 1. Extract the project and enter the directory
cd dharitri-sentu

# 2. Install dependencies
npm ci

# 3. Copy configuration (do not commit .env)
cp .env.example .env

# 4. Start the API and Vite development server together
npm run dev:full
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

`npm run dev:full` starts the API on port `8787` and Vite on port `5173`; Vite proxies `/api` to the backend. To run only the backend use `npm run server`. To run a production build and serve it through the same-origin Node API:

```bash
npm run build
npm start
```

The production server serves `dist/` from the same origin as the API.

## Local demo accounts

For local development, seeded demo accounts are enabled by default unless `ENABLE_DEMO_ACCOUNTS=false` is set:

| Role | Email | Demo password |
|---|---|---|
| Buyer | `buyer@demo.dharitrisentu.test` | `Demo123!` |
| Seller | `seller@demo.dharitrisentu.test` | `Demo123!` |
| Reviewer | `reviewer@demo.dharitrisentu.test` | `Demo123!` |

These are development-only accounts. Disable them in production. Create an actual reviewer account with `npm run create:reviewer` after starting the server once to initialise the database; the password is entered interactively and is not printed by the script. Do not share production reviewer credentials.

## Environment configuration

Copy `.env.example` to `.env` and adjust only what you are authorised to configure.

- `VITE_API_MODE=true` — use backend authentication, persistence, real upload endpoints and access controls.
- `VITE_MAPTILER_API_KEY` — optional restricted map key. Leave blank to use the configured keyless fallback; a map key alone does not provide cadastral data.
- `DOCUMENT_ENCRYPTION_KEY` — production required: 32 random bytes encoded as Base64 or 64 hex characters. Generate a key with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Back it up securely. **Losing or changing it without re-encrypting stored data makes existing files and tokens unreadable.**
- `CLAMSCAN_BIN` — absolute path to the installed `clamscan` executable. A configured executable must complete scans successfully before files leave quarantine.
- `ASSAM_LAND_RECORDS_LOOKUP_URL` and `ASSAM_LAND_RECORDS_API_KEY` — only use an endpoint and credentials formally authorised for your application. The adapter expects HTTPS, a Bearer credential, a `parcelId` query parameter and a JSON response. Confirm the real provider contract before use.
- `SETU_DIGILOCKER_BASE_URL` — use only `https://dg-sandbox.setu.co` for sandbox or `https://dg.setu.co` for production.
- `SETU_DIGILOCKER_CLIENT_ID`, `SETU_DIGILOCKER_CLIENT_SECRET`, `SETU_DIGILOCKER_PRODUCT_INSTANCE_ID` — server-side Setu credentials, required to send Setu's documented authentication headers.
- `SETU_DIGILOCKER_REDIRECT_URI` — a publicly reachable HTTPS callback matching the route `/api/integrations/digilocker/callback` and the URI configured/permitted for your Setu requester. The callback must return to the same application URL configured in `APP_PUBLIC_URL`.
- `GEMINI_API_KEY` and `GEMINI_MODEL` — server-only Gemini credentials and model. A configured key is not proof of account access/quota; test an actual AI request. Do not send sensitive records externally without appropriate user consent and privacy review.
- `ALLOWED_ORIGINS` — comma-separated origins accepted for state-changing API requests.
- `SMTP_*` — password reset sending remains disabled until a verified email delivery adapter/template is implemented and configured; setting SMTP values alone does not send reset mail.

Never put real credentials in source control or in `VITE_*` variables except intentionally public, domain-restricted browser keys. The example values are placeholders.

## Release readiness

See [`docs/Release-Readiness.md`](docs/Release-Readiness.md) for the commands run in this revision, environment-specific build/test blockers, and external prerequisites before production use. Dictionary key parity is not proof that every legacy page is fully translated; review user-facing screens in English, Assamese and Hindi before launch.

## Verification commands

```bash
node --check server/index.mjs
node --check server/create-reviewer.mjs
npm run test:api
npm test
npm run build
```

`npm run test:api` starts an isolated temporary API/database and verifies server health, bad-password rejection, session authentication, SHA-256 over original bytes, upload quarantine, denied access to quarantined content, reviewer-only actions and state access. Unit tests/build require the npm dependencies to be installed.

## Prototype versus connected app

Use the React app with `npm run dev:full` for the backend-connected application. Do not use standalone HTML mockups as evidence of API integration or security. The seeded marketplace is explicitly synthetic, while uploaded documents, user accounts, review decisions and consent records use the backend when `VITE_API_MODE=true`.

## Current limits (do not represent these as completed integrations)

1. All default parcel boundaries, listing records, owner names, prices and geospatial/risk layer values are fictional. There is no live official Assam cadastral or revenue feed configured.
2. The land-record adapter requires an approved provider endpoint, authentication details, response mapping, and end-to-end validation. A successful JSON response is not automatically a legal title verification.
3. The Setu DigiLocker integration uses the provider request/status/document APIs. It must be tested with the actual account credentials, a publicly reachable HTTPS callback, and the specific documents listed in that account. It does not assume Jamabandi/Patta coverage or establish legal title.
4. Without ClamAV configured and passing a scan, uploaded documents and photos are encrypted in quarantine and cannot be downloaded/shared or publicly displayed. This is intentional fail-closed behaviour.
5. The configured baseline application does not implement a production password-reset email delivery adapter. The UI/API explicitly reports that no reset email has been sent.
6. This is a foundation for a pilot, not a legal opinion, certified land registry, title guarantee, production security audit, or approval from any government agency. Arrange security review, privacy/legal review, backups, observability and departmental permission before real citizen-data use.


## Local setup (macOS / Windows)

- Install Node.js **22.16 or newer**. The API uses Node's built-in SQLite support.
- Run `npm ci`, copy `.env.example` to `.env`, then run `npm run doctor` to check configuration without printing secrets.
- Start both services with `npm run dev:full`. The launcher creates `.env` from `.env.example` if it is missing and warns if API mode is explicitly disabled.
- Open the Vite URL printed in the terminal (normally `http://127.0.0.1:5173`). Do not open `index.html` directly for the full-stack app.
- The Setu callback must be a public HTTPS URL registered for your Setu product. `localhost` cannot receive the provider's redirect. Real Setu, Gemini, SMTP, ClamAV and authorised Assam records access each require independently valid configuration.
- Never commit `.env`. Rotate any credential that has been pasted into a chat, ticket, screenshot, or repository.
