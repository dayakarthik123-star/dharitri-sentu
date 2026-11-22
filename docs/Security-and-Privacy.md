# Security and Privacy Controls

## Implemented in this codebase

- Server-side account records and password verification using Node `scrypt` with per-account random salts.
- Opaque session tokens stored as SHA-256 hashes in SQLite and delivered in an HTTP-only cookie.
- Login-attempt throttling and strict API role checks for seller uploads, reviewer decisions, shares, and state updates.
- Mutation-origin checks in production and standard response headers (`nosniff`, frame denial, referrer policy, permissions policy).
- File extension/signature consistency checks, 10 MiB upload limits, SHA-256 calculated over original file bytes, AES-256-GCM encryption at rest, private storage permissions, and fail-closed quarantine unless ClamAV scan returns clean.
- Server-side share authorization, expiry and revocation checks on each document request; document content is not stored in browser local storage.
- Setu DigiLocker consent request state is associated with the local account, callback request ID is matched against the stored request, and the upstream Setu status is rechecked before an active consent is recorded. Provider completion is not treated as evidence that a land record is official.
- Audit events for security-sensitive upload, login, review, share, revoke and access actions.

## Required deployment practices

1. Terminate HTTPS at a trusted platform and ensure secure cookie behavior for the deployed origin.
2. Set a strong, stable `DOCUMENT_ENCRYPTION_KEY` from a secret manager; back it up separately from the database and encrypted storage. Do not rotate it without a migration/re-encryption plan.
3. Disable demo accounts (`ENABLE_DEMO_ACCOUNTS=false`) and keep `.env`, databases, user uploads and private storage out of public archives and source control.
4. Configure and monitor ClamAV. Keep files quarantined on scan timeout/error. A passing malware scan is not authenticity verification.
5. Persist and back up both the database and encrypted files. Test restoration, key recovery, data retention and deletion.
6. Set narrow `ALLOWED_ORIGINS`, use platform rate limiting/WAF as appropriate, and conduct dependency, application, penetration and privacy reviews before exposing it publicly.
7. Use only authorised, documented service endpoints. Do not attempt to bypass government API access controls. Keep external credentials server-side.
8. Obtain legal/privacy review and explicit user consent before collecting real land records or identity documents. A SHA-256 hash proves byte integrity against a reference hash, not factual truth or legal validity.

## Known missing capabilities

- Password reset email delivery is not implemented; the app must not claim a reset email was sent.
- Automated virus scanning is unavailable unless a ClamAV executable is configured and returns clean.
- The Setu DigiLocker flow needs live account-specific testing; available issuer/document types and production readiness depend on approved credentials and callback setup.
- No official Assam land-record endpoint is shipped or configured. Default records/risk attributes are fictional.
- The API currently uses local SQLite and filesystem storage. For horizontal scaling, migrate to a managed database and private object storage with equivalent access controls.
