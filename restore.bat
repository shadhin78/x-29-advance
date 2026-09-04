@echo off
title X-29 Firestore Restore (x-29-advance)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Local Firestore Restore Utility...
echo ==================================================
echo.
node scripts\restore.js
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause
