@echo off
title RIS Surveillance System - Auto Launcher
color 0B

echo ===================================================
echo   RIS SURVEILLANCE SYSTEM - STARTUP INITIATED
echo ===================================================
echo.

echo [1/2] Lancement du Backend (Python Flask)...
cd /d "%~dp0\backend"
start "RIS Backend" cmd /c "title RIS Backend && python app.py || echo ERREUR BACKEND && pause"

echo [2/2] Lancement du Frontend (Vite/React)...
cd /d "%~dp0\frontend"
start "RIS Frontend" cmd /c "title RIS Frontend && npm run dev || echo ERREUR FRONTEND && pause"

echo.
echo ===================================================
echo   SYSTEME EN LIGNE !
echo   Le tableau de bord va s'ouvrir dans votre 
echo   navigateur a l'adresse: http://localhost:5173
echo ===================================================
timeout /t 3 >nul

:: Ouvre automatiquement le navigateur
start http://localhost:5173
exit
