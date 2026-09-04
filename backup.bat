@echo off
title X-29 Firestore Backup (x-2k29)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Local Firestore Backup...
echo ==================================================
echo.
node scripts\backup.js
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause
