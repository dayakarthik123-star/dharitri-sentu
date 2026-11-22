# Dharitri Sentu — Application Launcher for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\windows\start.ps1

Write-Host "==========================================================" -ForegroundColor ForestGreen
Write-Host " Starting Dharitri Sentu Full-Stack Application..." -ForegroundColor ForestGreen
Write-Host " API Server: http://localhost:8787" -ForegroundColor Cyan
Write-Host " Frontend:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor ForestGreen

# Run npm run dev:full (runs both Node API server and Vite concurrently)
npm run dev:full
