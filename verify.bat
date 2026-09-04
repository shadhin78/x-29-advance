@echo off
title X-29 Advance Firestore Backup Verification (x-29-advance)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Advance Firestore Backup Verification...
echo Source: D:\X-29-ADVANCE\X-29-advance-backups
echo ==================================================
echo.
node scripts\verify-backup.js %*
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause

