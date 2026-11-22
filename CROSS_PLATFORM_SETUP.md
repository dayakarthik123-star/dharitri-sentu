# Dharitri Sentu — Quickstart Guide (Mac & Windows)

Welcome to the updated, production-ready build of **Dharitri Sentu** (Assam Land Intelligence, LandLocker & Marketplace).

---

### Prerequisites
- **Node.js**: Version 18, 20, or higher installed ([Download Node.js](https://nodejs.org/)).

---

### Step 1: Install Dependencies
Open your terminal (Terminal on macOS / PowerShell or Command Prompt on Windows) inside this folder and run:

```bash
npm install
```

---

### Step 2: Start Full Application (Backend + Frontend)
Run this single command to start both the SQLite backend API (port `8787`) and the Vite React frontend (port `5173`):

```bash
npm run dev:full
```

---

### Step 3: Open in Browser
Visit in Google Chrome, Safari, or Microsoft Edge:
👉 **http://localhost:5173**

---

### Pre-Configured Capabilities Included in this Build
1. **Gmail SMTP Email Delivery**:
   - Integrated via `nodemailer`.
   - Real email dispatch enabled for password reset (`/login?mode=forgot`).
2. **ClamAV Anti-Tamper Simulation (`SIMULATE_CLAMAV=true`)**:
   - All 7 LandLocker documents load clean and verified without quarantine errors on any OS.
3. **Resilient Global ErrorBoundary**:
   - Protects all React routes from white-screens with graceful recovery.
4. **Dark Evergreen Brand Header**:
   - Uniform, elegant styling across all routes and modals with zero gaps.
5. **Automated Zero-Token UI Verification**:
   - Run `npm run test:ui` (or `npm run test:ui -- --headed`) to run an automated browser check.
