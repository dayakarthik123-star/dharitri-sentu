# Dharitri Sentu — Windows Setup Script
# Run with PowerShell: powershell -ExecutionPolicy Bypass -File .\scripts\windows\setup.ps1

Write-Host "==========================================================" -ForegroundColor DarkGreen
Write-Host " Dharitri Sentu - Assam Land Evidence Platform" -ForegroundColor DarkGreen
Write-Host " Windows 10/11 Automated Environment Setup" -ForegroundColor DarkGreen
Write-Host "==========================================================" -ForegroundColor White

$ErrorActionPreference = "Stop"

# 1. Check Node.js
Write-Host "`n[1/6] Checking Node.js runtime..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host ('  [OK] Found Node.js: ' + $nodeVersion) -ForegroundColor Green
} catch {
    Write-Host '  [ERROR] Node.js is not installed or not in PATH. Download and install from https://nodejs.org/' -ForegroundColor Red
    exit 1
}

# 2. Check npm
Write-Host "`n[2/6] Checking npm package manager..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host ('  [OK] Found npm: v' + $npmVersion) -ForegroundColor Green
} catch {
    Write-Host '  [ERROR] npm is not installed.' -ForegroundColor Red
    exit 1
}

# 3. Check ClamAV Antivirus
Write-Host "`n[3/6] Checking ClamAV Antivirus Scanner for Windows..." -ForegroundColor Cyan
$clamPaths = @(
    $env:CLAMSCAN_BIN,
    'C:\Program Files\ClamAV\clamscan.exe',
    'C:\Program Files (x86)\ClamAV\clamscan.exe',
    'C:\ProgramData\chocolatey\bin\clamscan.exe'
)
$clamFound = $false
foreach ($path in $clamPaths) {
    if ($path -and (Test-Path $path)) {
        $clamFound = $true
        $clamVer = & $path --version
        Write-Host ('  [OK] ClamAV detected: ' + $path + ' (' + $clamVer + ')') -ForegroundColor Green
        break
    }
}
if (-not $clamFound) {
    Write-Host '  [INFO] ClamAV was not detected in standard Windows directories.' -ForegroundColor Yellow
    Write-Host '    To install: winget install ClamAV.ClamAV  or  choco install clamav' -ForegroundColor Gray
    Write-Host '    Note: Uploaded documents will remain safely quarantined until scanned.' -ForegroundColor Gray
}

# 4. Check Tesseract OCR
Write-Host "`n[4/6] Checking Tesseract OCR for Windows..." -ForegroundColor Cyan
$tessPaths = @(
    $env:TESSERACT_BIN,
    'C:\Program Files\Tesseract-OCR\tesseract.exe',
    'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
)
$tessFound = $false
foreach ($path in $tessPaths) {
    if ($path -and (Test-Path $path)) {
        $tessFound = $true
        $tessVer = & $path --version 2>&1 | Select-Object -First 1
        Write-Host ('  [OK] Tesseract OCR detected: ' + $path + ' (' + $tessVer + ')') -ForegroundColor Green
        break
    }
}
if (-not $tessFound) {
    Write-Host '  [INFO] Tesseract OCR was not found in standard paths.' -ForegroundColor Yellow
    Write-Host '    To install: winget install UB-Mannheim.TesseractOCR' -ForegroundColor Gray
    Write-Host '    Note: Built-in Assam Jamabandi rule engine will serve as extraction fallback.' -ForegroundColor Gray
}

# 5. Environment configuration (.env)
Write-Host "`n[5/6] Checking .env configuration..." -ForegroundColor Cyan
if (-not (Test-Path '.env')) {
    if (Test-Path '.env.example') {
        Copy-Item '.env.example' '.env'
        Write-Host '  [OK] Created .env from .env.example with secure default development settings.' -ForegroundColor Green
    } else {
        Write-Host '  [WARN] .env.example not found.' -ForegroundColor Yellow
    }
} else {
    Write-Host '  [OK] .env file exists.' -ForegroundColor Green
}

# 6. Verify Node dependencies
Write-Host "`n[6/6] Verifying Node dependencies..." -ForegroundColor Cyan
if (Test-Path 'node_modules') {
    Write-Host '  [OK] node_modules exists.' -ForegroundColor Green
} else {
    Write-Host '  Installing npm dependencies...' -ForegroundColor Cyan
    npm install
}

Write-Host "`n==========================================================" -ForegroundColor DarkGreen
Write-Host " Windows Setup Complete!" -ForegroundColor DarkGreen
Write-Host " To start the fullstack application:" -ForegroundColor White
Write-Host " powershell -ExecutionPolicy Bypass -File .\scripts\windows\start.ps1" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor DarkGreen
