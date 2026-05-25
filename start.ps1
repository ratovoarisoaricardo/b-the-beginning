Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  RIS Surveillance System - Initializing..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "[1/3] Starting Backend Server (Python Flask)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

Write-Host "[2/3] Starting Frontend Server (Vite/React)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "[3/3] Waiting for servers to boot, then opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 4
Start-Process "http://localhost:5173/"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  System launched successfully!" -ForegroundColor Cyan
Write-Host "  (Keep the two newly opened PowerShell windows running)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
