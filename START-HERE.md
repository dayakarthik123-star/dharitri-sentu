# Dharitri Sentu — Start Here

## Local development (macOS recommended by the project owner)

Requirements: Node.js 22.16+ and npm 10+.

```bash
npm ci
cp .env.example .env
```

Edit `.env`; keep all secrets private. At minimum, the API initialises its database automatically and can run with development demo accounts. MapTiler is optional but required for the preferred map tiles. To make real document uploads retrievable, configure a stable `DOCUMENT_ENCRYPTION_KEY` and install/configure ClamAV. Files remain encrypted and quarantined until a real clean scan passes.

```bash
npm run dev:full
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

## Development demo accounts only

- Buyer: `buyer@demo.dharitrisentu.test` / `Demo123!`
- Seller: `seller@demo.dharitrisentu.test` / `Demo123!`
- Reviewer: `reviewer@demo.dharitrisentu.test` / `Demo123!`

Do not use demo accounts in production. Set `ENABLE_DEMO_ACCOUNTS=false` and provision authorised accounts securely before deployment. Official reviewer login is separate at `/official/login`; no reviewer link is shown in public navigation.

## Build and checks

```bash
npm run lint
npm run test:api
npm test
npm run build
NODE_ENV=production ENABLE_DEMO_ACCOUNTS=false npm start
```

Review `docs/Release-Readiness.md`, `docs/Security-and-Privacy.md`, and `docs/Known-Limitations.md` before deployment. The source ZIP intentionally excludes `node_modules`, `.env`, the runtime database, and any private uploads.

## External integration truth

- Setu: add the actual client ID, client secret and Product Instance ID, plus a public HTTPS callback matching the approved Setu setup; test the real provider flow. Available issuer documents depend on the account.
- Gemini: configure `GEMINI_API_KEY` server-side and test the actual model/quota. Do not send sensitive documents without consent and an acceptable data-use arrangement.
- Assam land records: no authorised government API endpoint/key is bundled. Use source-labelled uploaded official records and synthetic demo listings until access is approved.
- Seeded parcel boundaries, owner names, prices and risks are synthetic, not government-verified records.
