@echo off
title X-29 Advance Firestore Restore (x-29-advance)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Advance Firestore Restore Utility...
echo Source: D:\X-29-ADVANCE\X-29-advance-backups
echo ==================================================
echo.
node scripts\restore.js %*
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause

