# Dharitri Sentu — Dependency Checker for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\windows\check-dependencies.ps1

Write-Host "`nDharitri Sentu Dependency and Security Diagnostics" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Gray

$allGood = $true

# Node.js
Write-Host -NoNewline 'Checking Node.js... '
try {
    $nv = node --version
    Write-Host ('[OK] ' + $nv) -ForegroundColor Green
} catch {
    Write-Host '[MISSING] Node.js is required!' -ForegroundColor Red
    $allGood = $false
}

# npm
Write-Host -NoNewline 'Checking npm... '
try {
    $npmv = npm --version
    Write-Host ('[OK] v' + $npmv) -ForegroundColor Green
} catch {
    Write-Host '[MISSING] npm is required!' -ForegroundColor Red
    $allGood = $false
}

# ClamAV
Write-Host -NoNewline 'Checking ClamAV Scanner... '
$clamBin = $null
$candidateClam = @(
    $env:CLAMSCAN_BIN,
    'C:\Program Files\ClamAV\clamscan.exe',
    'C:\Program Files (x86)\ClamAV\clamscan.exe',
    'C:\ProgramData\chocolatey\bin\clamscan.exe'
)
foreach ($c in $candidateClam) {
    if ($c -and (Test-Path $c)) { $clamBin = $c; break }
}
if ($clamBin) {
    $cVer = & $clamBin --version
    Write-Host ('[OK] ' + $cVer) -ForegroundColor Green

    # Database check
    Write-Host -NoNewline 'Checking ClamAV Signatures... '
    $dbDirs = @('C:\Program Files\ClamAV\database', 'C:\ProgramData\ClamAV\database', $env:CLAMAV_DB_DIR)
    $hasDb = $false
    foreach ($d in $dbDirs) {
        if ($d -and (Test-Path $d)) {
            $files = Get-ChildItem -Path $d -Filter '*.c?d' -ErrorAction SilentlyContinue
            if ($files.Count -gt 0) { $hasDb = $true; break }
        }
    }
    if ($hasDb) {
        Write-Host '[OK] Signatures found.' -ForegroundColor Green
    } else {
        Write-Host '[WARN] Run freshclam to download virus definitions.' -ForegroundColor Yellow
    }
} else {
    Write-Host '[OPTIONAL / QUARANTINE ACTIVE] Not installed.' -ForegroundColor Yellow
    Write-Host '  -> Documents stay in quarantine until ClamAV is installed.' -ForegroundColor Gray
}

# Tesseract
Write-Host -NoNewline 'Checking Tesseract OCR... '
$tessBin = $null
$candidateTess = @(
    $env:TESSERACT_BIN,
    'C:\Program Files\Tesseract-OCR\tesseract.exe',
    'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
)
foreach ($t in $candidateTess) {
    if ($t -and (Test-Path $t)) { $tessBin = $t; break }
}
if ($tessBin) {
    $tVer = & $tessBin --version 2>&1 | Select-Object -First 1
    Write-Host ('[OK] ' + $tVer) -ForegroundColor Green
} else {
    Write-Host '[OPTIONAL / FALLBACK ACTIVE] Not installed.' -ForegroundColor Yellow
    Write-Host '  -> Rule-based Jamabandi extractor will be used as fallback.' -ForegroundColor Gray
}

# Database file check
Write-Host -NoNewline 'Checking SQLite Database... '
if (Test-Path 'server\storage\dharitri.sqlite') {
    $size = (Get-Item 'server\storage\dharitri.sqlite').Length / 1024
    Write-Host ('[OK] Present (' + [math]::Round($size, 1) + ' KB)') -ForegroundColor Green
} else {
    Write-Host '[INFO] Will be initialized automatically on first server startup.' -ForegroundColor Cyan
}

# Document Encryption Key check
Write-Host -NoNewline 'Checking AES-256-GCM Encryption Key... '
if (Test-Path 'server\storage\.document-encryption-key') {
    Write-Host '[OK] Keyfile active.' -ForegroundColor Green
} elseif ($env:DOCUMENT_ENCRYPTION_KEY) {
    Write-Host '[OK] Set in environment.' -ForegroundColor Green
} else {
    Write-Host '[INFO] Will be generated automatically on first dev run.' -ForegroundColor Cyan
}

Write-Host '==========================================================' -ForegroundColor Gray
if ($allGood) {
    Write-Host "All essential runtime dependencies are satisfied.`n" -ForegroundColor Green
} else {
    Write-Host "Please resolve missing essential dependencies before starting.`n" -ForegroundColor Red
}
