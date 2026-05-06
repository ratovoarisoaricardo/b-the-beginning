@echo off
echo [SENTINEL-AI] Synchronisation avec GitHub en cours...
git add .
git commit -m "Mise a jour automatique Sentinel-AI - %date% %time%"
git push
echo [SENTINEL-AI] Synchronisation terminee !
pause
