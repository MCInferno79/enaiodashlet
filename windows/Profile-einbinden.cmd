@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Fuer das Einbinden exportierter Profile ist Node.js 22 oder neuer erforderlich.
  echo Node.js wird fuer den spaeteren Betrieb nicht benoetigt.
  pause
  exit /b 1
)
tasklist /FI "IMAGENAME eq StreamDeck.exe" /NH 2>nul | find /I "StreamDeck.exe" >nul
if not errorlevel 1 (
  echo Stream Deck vor der Paketvorbereitung vollstaendig beenden.
  pause
  exit /b 1
)
node "tools\profiles.mjs" "streamdeck-plugin"
set "HEKI_RESULT=%ERRORLEVEL%"
pause
exit /b %HEKI_RESULT%
