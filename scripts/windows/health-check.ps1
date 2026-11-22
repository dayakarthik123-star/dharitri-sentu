# Dharitri Sentu — Application Health & API Prober
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\windows\health-check.ps1

Write-Host "Probing Dharitri Sentu Backend API..." -ForegroundColor Cyan

$endpoints = @(
    "http://127.0.0.1:8787/api/health",
    "http://127.0.0.1:8787/api/integrations/status"
)

foreach ($ep in $endpoints) {
    Write-Host -NoNewline "Checking $ep... "
    try {
        $res = Invoke-RestMethod -Uri $ep -Method Get -TimeoutSec 5
        if ($res.ok) {
            Write-Host "[OK]" -ForegroundColor Green
            if ($res.integrations) {
                Write-Host "  - Antivirus Status:        $($res.integrations.antivirus.status)" -ForegroundColor Gray
                Write-Host "  - Encryption Status:       $($res.integrations.documentEncryption.status)" -ForegroundColor Gray
                Write-Host "  - Setu DigiLocker Status:  $($res.integrations.digilocker.status)" -ForegroundColor Gray
                Write-Host "  - Assam Records Status:    $($res.integrations.assamLandRecords.status)" -ForegroundColor Gray
            }
        } else {
            Write-Host "[ERROR: ok=false]" -ForegroundColor Red
        }
    } catch {
        Write-Host "[FAILED: $_]" -ForegroundColor Red
    }
}
