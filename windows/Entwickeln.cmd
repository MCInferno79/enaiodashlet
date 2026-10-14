@echo off
setlocal
cd /d "%~dp0source"
where node >nul 2>nul
if errorlevel 1 exit /b 1
call npm ci
if errorlevel 1 exit /b 1
call npm run check
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
call npm test
if errorlevel 1 exit /b 1
call npm run release
pause
