# Architecture and Data Boundaries

## Application path

- **Frontend:** React + TypeScript + Vite. `VITE_API_MODE=true` calls `/api/*` endpoints through a same-origin client.
- **API server:** `server/index.mjs`, Node 22+ HTTP server, built-in `node:sqlite`, cookie sessions, scrypt password hashes, JSON state validation and role-based mutation paths.
- **Persistence:** SQLite database for users, sessions, application state, uploads, shares, OAuth state/tokens, and audit events.
- **File vault:** encrypted payloads use AES-256-GCM envelopes. Uploads first enter a private quarantine directory; they are moved to the normal private storage directory only after ClamAV returns a clean status.
- **Development:** `scripts/run-dev.mjs` runs the API and Vite server; Vite proxies `/api` to port 8787.
- **Production:** `npm run build` creates `dist/`; `npm start` serves the SPA and API from one origin.

## Key workflows

1. **Authentication:** sign-up/login -> server-side password hash verification -> hashed opaque session token -> HTTP-only cookie -> session checked on API routes.
2. **LandLocker upload:** actual multipart bytes -> extension/signature checks -> malware scan -> SHA-256 -> AES-256-GCM at rest -> private metadata in SQLite -> remain quarantined unless scan returns clean.
3. **Document access:** every content request checks ownership, reviewer role, or active non-revoked share with an unexpired timestamp; encrypted bytes are decrypted in memory only after authorization.
4. **Listing-photo upload:** seller-only multipart route -> file signature/size checks -> encrypted private/quarantined storage -> photo ID returned -> listing merge accepts only media IDs owned by that seller -> publication is blocked until all linked photos have passed scans.
5. **Reviewer workflow:** server API role checks are authoritative; frontend role guards are a UX layer, not a substitute for API permissions.
6. **DigiLocker:** short-lived one-time OAuth state -> provider redirect -> callback validates state and exchanges code over HTTPS -> token encrypted at rest. A separate provider-specific resource/consent adapter is still required to import documents.
7. **Land records:** configured authorised HTTPS JSON endpoint -> Bearer credential -> `parcelId` query -> returned source origin and retrieval timestamp. Response interpretation/official status require mapping and human/legal verification.

## Data trust levels

- **Synthetic demo data:** fixtures for UI display and demonstrations; never official.
- **Seller-provided:** values and files submitted by a seller; not independently verified by being uploaded or hashed.
- **Security-scanned:** ClamAV returned clean; means only the configured malware scan passed.
- **Reviewer-checked:** a reviewer recorded an outcome; the meaning/scope of that review must be shown and does not imply government certification.
- **Government-source retrieved:** only use this label after a documented, authorised source actually returned the record, its identity/matching are validated, and provenance is preserved.
