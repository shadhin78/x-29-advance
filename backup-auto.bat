@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo Starting X-29 Advance Automatic Scheduled Backup...
echo Project: D:\X-29-ADVANCE\X-29-advance-code
echo Target:  D:\X-29-ADVANCE\X-29-advance-backups
echo ==================================================
echo.

node scripts\backup.js --automatic
set EXITCODE=%ERRORLEVEL%

echo.
echo ==================================================
echo Backup process completed with exit code: %EXITCODE%
echo ==================================================

exit /b %EXITCODE%
