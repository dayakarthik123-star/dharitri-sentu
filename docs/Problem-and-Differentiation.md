# Problem Understanding, User Workflows, and Differentiation

## 1. Target Problem in Context

Prospective land buyers and smallholder landholders (pattadars) in Assam often face fragmented information when evaluating a land transaction:
- **Scattered Evidence**: A buyer must mentally reconcile what a seller states in an advertisement (asking area in Bigha/Katha/Lessa, Dag number, Patta number, land class) against separate revenue extracts, trace sketches, and physical boundaries.
- **Over-reliance on Informal Intermediaries**: When basic parcel context and due-diligence steps are opaque, ordinary buyers and sellers often depend heavily on unregulated middlemen.
- **Misleading "Verified" Claims**: Conventional property listing websites either show unverified seller claims or use vague "Verified" badges without disclosing which fields were compared, against what source, and when.

### Honest Scope Boundary
Dharitri Sentu is designed to **reduce avoidable information asymmetry** and **guide structured due diligence**. It does **not** promise to eliminate all brokers, prevent all fraud, resolve title disputes, or replace licensed legal counsel and official revenue mutation procedures.

## 2. Core User Workflows

1. **Prospective Buyer (`buyer@demo.dharitrisentu.test`)**:
   - Searches by district, village, or parcel ID (`AS-KMP-001`) on the interactive map and marketplace.
   - Inspects the **Land Trust Passport** to see which fields match synthetic reference data and which fields have discrepancies or remain unchecked.
   - Opens a **9-step Due-Diligence Case** (`DD-2026-001`), requests supporting documents via an internal enquiry thread, and views shared documents in **LandLocker**.
2. **Land Seller (`seller@demo.dharitrisentu.test`)**:
   - Submits a parcel through the **8-step validated listing workflow** (`/sell/new`), providing Dag/Patta references, Bigha area, asking price, and an explicit honesty declaration.
   - Uploads demonstration documents to **LandLocker**, grants or revokes buyer/reviewer access, and replies to buyer enquiries.
3. **Demo Reviewer (`reviewer@demo.dharitrisentu.test`)**:
   - Moderates submitted listings (`Submitted` → `Under Review` → `More Information Required` or `Published as Demo Listing`).
   - Investigates flagged record discrepancies (`DSC-001` through `DSC-005`), records neutral audit notes, and updates checklist items.

## 3. Differentiation & Prior Art Context

| Capability | Typical Classified Property Portal | Official Government Revenue Portal | Dharitri Sentu Prototype |
|---|---|---|---|
| **Primary Purpose** | Advertising listings & lead generation | Authoritative statutory record lookup | Connecting buyers & sellers around source-labelled due diligence |
| **Field-Level Comparison** | Rare; relies on seller text | Displays official record only | Side-by-side comparison of Seller Claim vs Reference Fixture |
| **Handling of Mismatches** | Hidden or binary badge | N/A | Neutral **Discrepancy Case** (*"Potential inconsistency requiring review"*) |
| **Guided Buyer Workflow** | None | Statutory application forms | Interactive 9-step **Due-Diligence Checklist** & **LandLocker** consent log |

*Note on Prior Art & IP*: All design hypotheses above are presented for competition evaluation. Open-source dependencies (`React`, `React Router`, `Tailwind CSS`, `Lucide`, `Leaflet`, `Recharts`, `Vitest`) are used under their respective MIT/ISC licences.
