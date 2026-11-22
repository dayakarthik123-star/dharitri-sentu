# Development Timeline, Milestones, Team Roles, and Resources

## 1. Phased Development Roadmap

| Phase | Milestone Scope | Status | Key Deliverables / Dependencies |
|---|---|---|---|
| **Phase 1** | **Interactive Competition Prototype (Current)** | **Completed** | All 10 features, 3-language UI (`en`, `as`, `hi`), 12 synthetic Assam parcels, connected Buyer/Seller/Reviewer state, USPR documentation pack. |
| **Phase 2** | **Backend API, Database & Security Hardening (Weeks 1–6)** | Planned | PostgreSQL + PostGIS parcel store, server-side RBAC, encrypted S3/MinIO LandLocker vault, automated CI/CD & Playwright suite. |
| **Phase 3** | **Linguistic & Legal-Workflow Review (Weeks 5–8)** | Planned | Professional native-speaker review of Assamese and Hindi legal/revenue terms; consultation with Assam revenue law practitioners. |
| **Phase 4** | **Controlled Sandbox Usability Pilot (Weeks 9–12)** | Planned | Supervised usability evaluation with sample buyers, sellers, and reviewers using synthetic and consented test cases. |

## 2. Required Multidisciplinary Team Roles

Rather than fabricating biographies of non-existent personnel, the project defines the concrete roles required to take Dharitri Sentu from prototype to production:
- **Lead Full-Stack & GIS Engineer**: React/TypeScript frontend, PostGIS spatial queries, and WMS/GeoJSON cadastral rendering.
- **Product Designer & UX Researcher**: Accessible low-literacy workflows, responsive mobile layout, and field usability testing in Assam.
- **Assamese & Hindi Localization Specialist**: Native terminology review for terms such as *Dag*, *Patta*, *Bigha-Katha-Lessa*, *Jamabandi*, and *Bari*.
- **Security & Privacy Engineer**: DPDP Act 2023 compliance, encrypted document storage, and CERT-In vulnerability assessment.
- **Legal & Revenue Domain Advisor**: Ensuring all platform checklists and disclaimers align with Assam land transfer regulations.
