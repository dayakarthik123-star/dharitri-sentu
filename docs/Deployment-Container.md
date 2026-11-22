# Container deployment guide

This repository includes a multi-stage Docker build and a Compose service for a single-instance pilot. It is a deployment convenience, not a substitute for a production security review or managed database/object storage.

## Before building

1. Install Docker Engine/Desktop with Compose v2.
2. Copy `.env.production.example` to `.env.production` and replace placeholders.
3. Generate a stable 32-byte document encryption key, for example with `openssl rand -hex 32`. Store it in a secrets manager in real deployments. Back it up separately: losing it makes encrypted uploads unreadable.
4. Set the real public URL and exact allowed origin. Configure a TLS reverse proxy in front of the service; do not expose the container port directly to the public internet.
5. Use `ENABLE_DEMO_ACCOUNTS=false` (Compose enforces this) and provision reviewer accounts only through the approved admin procedure.

## Build and run

```bash
cp .env.production.example .env.production
# Edit .env.production; do not commit it.
docker compose up --build -d
docker compose ps
docker compose logs -f dharitri-sentu
curl -fsS http://127.0.0.1:8787/api/health
```

The service binds to loopback on host port 8787 by default. Put an HTTPS reverse proxy in front of it and keep the database/document volume backed up. Stop with `docker compose down`; the named data volume remains. To remove persistent data intentionally, `docker compose down -v` deletes the volume and its data.

## Important operational caveats

- The image build runs `npm ci` and `npm run build`; it requires access to the npm registry and has not been validated in this offline execution session.
- The server uses SQLite. Treat this Compose file as a single-instance pilot; do not scale multiple app replicas against one local SQLite file.
- The production example intentionally does not enable demo accounts. Ensure all required secrets and integrations are tested before enabling real users.
- ClamAV must be installed and the `CLAMSCAN_BIN` path must resolve inside the runtime container before expecting clean scans. The sample image does not install ClamAV.
- The service health check proves only that `/api/health` responds. It does not prove Setu, Gemini, Assam land records, email, malware scanning, backup restore, or government verification is working.
- Setu and Gemini require real account credentials and end-to-end tests. Assam land-record API access is not bundled. Seed data is synthetic.
- For a public launch, add TLS, centralised secrets, durable encrypted backups, alerting, log retention controls, dependency/security scans, rate-limit review, a restore drill, privacy/legal review, and an independent security assessment.
