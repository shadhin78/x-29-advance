@echo off
title X-29 Disaster Recovery Test (x-2k29)
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Firestore Disaster Recovery Test...
echo ==================================================
echo.
node scripts\disaster-recovery-test.js --exec
echo.
echo ==================================================
echo Process finished.
echo ==================================================
pause
