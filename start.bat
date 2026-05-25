@echo off
color 0B
echo ===================================================
echo   RIS Surveillance System - Initializing...
echo ===================================================

echo [1/3] Starting Backend Server (Python Flask)...
start "RIS Backend (Port 5000)" cmd /k "cd backend && python app.py"

echo [2/3] Starting Frontend Server (Vite/React)...
start "RIS Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo [3/3] Waiting for servers to boot, then opening browser...
timeout /t 4 /nobreak >nul
start http://localhost:5173/

echo ===================================================
echo   System launched!
echo   (Keep the two other terminal windows open)
echo ===================================================
pause
