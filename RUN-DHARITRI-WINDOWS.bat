@echo off
setlocal
cd /d "%~dp0"
echo.
echo Dharitri Sentu - Windows setup
node --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Install Node.js 22.16 or newer from https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=1 delims=v." %%A in ('node --version') do set NODE_MAJOR=%%A
if not exist .env (
  if exist .env.example (
    copy .env.example .env >nul
    echo Created .env from .env.example. Add provider credentials only if needed.
  )
)
if not exist node_modules (
  echo Installing project dependencies. This may take a few minutes...
  call npm ci
  if errorlevel 1 (
    echo ERROR: Dependency installation failed. Copy the full error output for troubleshooting.
    pause
    exit /b 1
  )
)
call npm run doctor
 echo.
echo Starting API and frontend. Keep this window open.
call npm run dev:full
pause
