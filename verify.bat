@echo off
title X-29 Firestore Backup Verification (x-2k29)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Local Firestore Backup Verification...
echo ==================================================
echo.
node scripts\verify-backup.js %*
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause
