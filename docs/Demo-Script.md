# Live Judge Demonstration Script (10-Step Repeatable Walkthrough)

Before starting the demonstration, click **`Reset Demo Data`** in the top header (or inside `/admin`) so all seeded listings, enquiries, discrepancies, and LandLocker permissions start from a clean, repeatable state.

1. **Enter the Website & Observe the Cinematic Intro (3s)**:
   - Open `/`. Observe the Assam tea-garden morning landscape, floating tea leaves (`AmbientLeaves`), letter-by-letter *Dharitri Sentu* title reveal, and `Skip Intro →` control.
2. **Discover a Sample Parcel on the Interactive Map**:
   - On the homepage search bar, click the **`Kamrup`** popular search chip or select `Parcel AS-KMP-001` on the interactive map preview. Observe the persistent notice: *"Demonstration parcel geometry — not an official cadastral boundary."*
3. **Log In as the Demo Buyer**:
   - Go to `/login` and click the one-click **Buyer** button (`buyer@demo.dharitrisentu.test` / `Demo123!`). Inspect `/dashboard/buyer` (Saved Listings, Enquiries, Due-Diligence Cases, Recent Searches).
4. **Save a Listing & Submit a Buyer Enquiry**:
   - Open `/land/lst-1` (*Riverside Agricultural & Tea-Adjacent Land*), click **Save**, then click **Make an Enquiry** and send a question to the seller.
5. **Log In as the Demo Seller & Respond / Create a Listing**:
   - Switch to `seller@demo.dharitrisentu.test` at `/login`. Open `/dashboard/seller`, reply to the buyer's enquiry, and visit `/sell/new` to submit a new demonstration listing (which enters the `Submitted` state — never self-verified).
6. **Open the Land Trust Passport**:
   - Navigate to `/passport/lst-1`. Inspect the source-labelled field comparisons, timestamps, and the prominent warning that the Passport is not an official government title certificate.
7. **Identify a Planted Record Discrepancy**:
   - Open `/discrepancies` and select **`DSC-001`** (`2.50 Bigha` seller-declared vs `2.35 Bigha` synthetic survey fixture) or **`DSC-003`** (`Dag 308` vs `Dag 380` on `AS-NLB-003`).
8. **Open a Connected Due-Diligence Case**:
   - Visit `/cases/DD-2026-001`. Update a checklist task status and observe the progress bar and chronological event timeline update immediately.
9. **Log In as the Demo Reviewer & Moderate State**:
   - Switch to `reviewer@demo.dharitrisentu.test` at `/login`. Open `/admin`, change a listing's moderation status, add a reviewer note to a discrepancy, and inspect the **Government Integration Boundaries** tab (`Not Connected`).
10. **Demonstrate Language Switching, LandLocker, Voice Assistant, Virtual Tours & Price Projections**:
    - Use the header selector to switch between **English (`EN`)**, **Assamese (`AS`)**, and **Hindi (`HI`)**.
    - Visit `/landlocker` to grant and revoke document access.
    - Visit `/assistant` to test deterministic local Q&A and voice controls.
    - Visit `/virtual-tour/lst-1` to pan the 360° horizon and open fullscreen view.
    - Visit `/price-explorer` to adjust starting value, rate, and years using `Starting Value × (1 + rate)^years`.
