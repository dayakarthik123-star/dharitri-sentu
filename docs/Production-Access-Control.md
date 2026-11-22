# Production access-control and release policy

## Roles and workspace boundaries

| Capability | Public | Buyer | Seller | Government reviewer | Platform administrator |
|---|---:|---:|---:|---:|---:|
| Public approved marketplace listings | Yes | Yes | Yes | Assigned cases only | Yes, operational oversight |
| Create/manage own listings | No | No | Own listings | No | Moderation only |
| Saved listings and buyer enquiries | No | Own | Respond to own listings | Assigned cases only | Audited support access only |
| Due-diligence cases | No | Own/participant | Own/participant | Explicitly assigned cases | Assignment and oversight (planned) |
| LandLocker document metadata/content | No | Owner or active share | Owner or active share | Explicit active share | Break-glass access (planned; must be audited) |
| Listing/document review decisions | No | No | No | Assigned records only | No routine review decisions |
| User/role administration | No | No | No | No | Planned separate role |
| Platform configuration/security operations | No | No | No | No | Planned separate role |

## Enforced in this release

- Public signup creates buyer or seller accounts only. Reviewer accounts are provisioned out-of-band.
- Production builds always use the server API; they cannot silently fall back to browser-local demo authentication.
- Demo accounts are disabled whenever `NODE_ENV=production`, regardless of `ENABLE_DEMO_ACCOUNTS`.
- A fresh production database starts with empty application collections rather than seeded listings, documents, enquiries, cases, or audit fixtures. Existing databases are not destructively cleared.
- Public listing visibility is limited to `Approved for Listing`; the legacy `Published as Demo Listing` state is not publicly exposed.
- Buyer/seller records are scoped to participation or ownership. Reviewer case, discrepancy, listing and media access is filtered to explicit `assignedReviewerId` or `assignedReviewerEmail` matches.
- Document access is limited to owner or a currently active, unrevoked share. A reviewer does not receive blanket document access.
- Document sharing is time-limited and revocable.

## Not yet implemented — do not represent as complete

- A separate platform-administrator identity/role, administration console, and reviewer-assignment workflow. The existing `reviewer` role is a government-review workflow role, not a platform administrator.
- A formal case-assignment API/UI. Until implemented, records must be assigned by a trusted operator through a controlled backend process using `assignedReviewerId` or `assignedReviewerEmail`; do not expose ad-hoc database editing to end users.
- Fine-grained field-level permissions and a dedicated audited break-glass support workflow.
- Complete localisation of every hard-coded string and a full visual/button/accessibility audit. Translation resources currently have matching keys, but this does not prove all visible strings use the translation layer.

## Production deployment gates

1. Set `NODE_ENV=production` and build with `VITE_API_MODE=true` (the production frontend now forces API mode).
2. Use a persistent encrypted volume for `DATA_DIR` and `DB_PATH`; back up SQLite and the document store together.
3. Configure and securely back up a stable 32-byte `DOCUMENT_ENCRYPTION_KEY`. Never rotate it without a document migration/re-encryption plan.
4. Configure a verified ClamAV scanner before accepting user documents. Uploads without a confirmed clean scan remain quarantined.
5. Configure real HTTPS `APP_PUBLIC_URL`, `ALLOWED_ORIGINS`, and provider callback URLs. Keep all secrets server-side.
6. Configure only authorised land-record and DigiLocker integrations. A Setu connection or platform review is not government title certification.
7. Run `npm ci`, `npm run lint`, `npm test`, `npm run test:api`, and `npm run build` in CI before deployment.
8. Test cross-account isolation with separate buyer, seller, and reviewer accounts and verify every denied request returns 401/403.

## Data safety

This update intentionally does not delete records from an existing database. Before any data cleanup, take a verified backup and identify records by provenance. Never infer that a real user's record is demo data based only on its appearance or email domain.
