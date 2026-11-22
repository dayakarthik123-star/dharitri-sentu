# Dharitri Sentu — Windows Setup & Production Verification Guide

Welcome to **Dharitri Sentu (ধৰিত্ৰী সেতু)** — Assam Land Exchange: Government-Verified Marketplace for Buying and Selling Land.

This document describes setting up, configuring, and verifying the 10-stage document verification and land evidence engine on **Windows 10 and Windows 11**.

---

## 1. Prerequisites

Ensure you have the following installed on your Windows machine:
- **Node.js**: v20.x, v22.x or later ([Download from nodejs.org](https://nodejs.org/))
- **npm**: v10.x or later (bundled with Node.js)
- **PowerShell**: Windows PowerShell 5.1 or PowerShell Core 7+

---

## 2. Automated Setup (Recommended)

Open **PowerShell** as Administrator and navigate to the project directory:

```powershell
cd "C:\path\to\dharitri-rebuild"

# Run automated setup: checks Node, installs dependencies, verifies environment
powershell -ExecutionPolicy Bypass -File .\scripts\windows\setup.ps1
```

To verify your system dependencies at any time:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\check-dependencies.ps1
```

---

## 3. External Security Dependencies (Windows Installation)

### A. ClamAV Antivirus Scanner (Stage 2)
ClamAV scans uploaded land deeds, trace maps, and buyer/seller documents for malware before they leave private quarantine.

1. **Install via Winget (or Chocolatey):**
   ```powershell
   winget install ClamAV.ClamAV
   # OR with Chocolatey:
   choco install clamav
   ```
2. **Download Signature Databases:**
   In PowerShell (Administrator):
   ```powershell
   & "C:\Program Files\ClamAV\freshclam.exe"
   ```
3. **Verify:**
   ```powershell
   & "C:\Program Files\ClamAV\clamscan.exe" --version
   ```
4. **Environment Variable:**
   If installed in a custom location, add to your `.env`:
   ```ini
   CLAMSCAN_BIN=C:\Program Files\ClamAV\clamscan.exe
   ```

*Security Note: If ClamAV is not installed, documents remain safely encrypted in local quarantine (`server/storage/quarantine`). The system never marks un-scanned files as passed.*

---

### B. Tesseract OCR Engine (Stage 5)
Tesseract OCR powers automated text and Jamabandi field extraction from scanned Assamese and English documents.

1. **Install via Winget:**
   ```powershell
   winget install UB-Mannheim.TesseractOCR
   ```
   *Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`*
2. **Assamese Language Model (Optional):**
   - Download `asm.traineddata` from [tesseract-ocr/tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast/raw/main/asm.traineddata).
   - Place into: `C:\Program Files\Tesseract-OCR\tessdata\`
3. **Environment Variable:**
   ```ini
   TESSERACT_BIN=C:\Program Files\Tesseract-OCR\tesseract.exe
   TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
   ```

*Note: If Tesseract is not installed, the engine uses the built-in regex and token parser in `server/jamabandiEngine.mjs` as a graceful fallback.*

---

## 4. Environment Configuration (`.env`)

Copy the provided template:
```powershell
Copy-Item .env.example .env
```

Key variables configured in `.env`:
- `PORT=8787` (Backend Node API)
- `APP_PUBLIC_URL=http://localhost:5173` (Vite Frontend)
- `DOCUMENT_ENCRYPTION_KEY`: Auto-generated on first dev launch, or provide a 32-byte hex/base64 key.
- `SETU_DIGILOCKER_BASE_URL=https://dg-sandbox.setu.co` (Sandbox endpoint)

---

## 5. Starting the Full-Stack Application

Run the start script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\start.ps1
```

Or run via npm:
```powershell
npm run dev:full
```

The services will start at:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://127.0.0.1:8787](http://127.0.0.1:8787)
- **Database:** `server/storage/dharitri.sqlite` (Native SQLite in WAL mode)

---

## 6. Probing System Health

Check the live system health and integration status:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\health-check.ps1
```

Or query the API directly:
```powershell
curl http://127.0.0.1:8787/api/health
```

---

## 7. The 10-Stage Document Verification Pipeline

When a land document is uploaded to LandLocker, it traverses the 10 stages:

| Stage | Name | Description | Windows Engine |
|---|---|---|---|
| **1** | **File Signature & Magic Bytes** | Validates PDF/JPG/PNG/WebP headers, rejects mismatched extensions | Node Buffer inspector |
| **2** | **Malware Scanning** | Scans in private staging bucket; infected files are deleted immediately | ClamAV Windows binary |
| **3** | **SHA-256 Integrity Digest** | Calculates cryptographic digest from raw bytes | `node:crypto` |
| **4** | **Protected Storage** | Encrypts document at rest with AES-256-GCM | `crypto.createCipheriv` |
| **5** | **OCR & Jamabandi Extraction** | Extracts Dag, Patta, Mouza, Circle, Village, Landowner, and Area | Tesseract OCR + Jamabandi Engine |
| **6** | **Assam Government Lookup** | Checks authoritative Assam ILRMS / Dharitree API (reports unavailable if unconfigured) | `assamLandRecordAdapter` |
| **7** | **Parcel Field Comparison** | Unit-aware comparison (Bigha-Katha-Lessa) and Assamese name matching | `comparisonEngine` |
| **8** | **Digital Signature Check** | Inspects PDF `/ByteRange` and embedded PKCS#7 signatures | `digitalSignatureAdapter` |
| **9** | **Consent & Access Control** | Private by default; enforced server-side on file download | `document_shares` & `document_consents` |
| **10**| **Authorised Reviewer Sign-Off**| Official reviewer inspects discrepancies and records immutable decision | `review_decisions` |

---

## 8. Running Automated Tests

Run the Vitest test suite:
```powershell
npm test -- --run
```

Verify TypeScript types:
```powershell
npx tsc --noEmit
```

Build production bundle:
```powershell
npm run build
```
