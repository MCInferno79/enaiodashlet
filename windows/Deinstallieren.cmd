@echo off
setlocal
if not defined APPDATA exit /b 1
cd /d "%~dp0"
tasklist /FI "IMAGENAME eq StreamDeck.exe" /NH 2>nul | find /I "StreamDeck.exe" >nul
if not errorlevel 1 (
  echo Stream Deck zuerst vollstaendig beenden.
  pause
  exit /b 1
)
echo Entfernt das PageDeck-Plugin und lokale Kopplung/Logs einschliesslich alter Einstellungen.
echo Exportierte oder importierte Benutzerprofile und andere Plugins bleiben erhalten.
choice /C JN /N /M "PageDeck entfernen? [J/N] "
if errorlevel 2 exit /b 0
if exist "%APPDATA%\Elgato\StreamDeck\Plugins\de.heki.autoprofile.sdPlugin" rmdir /S /Q "%APPDATA%\Elgato\StreamDeck\Plugins\de.heki.autoprofile.sdPlugin"
if exist "%APPDATA%\PageDeck" rmdir /S /Q "%APPDATA%\PageDeck"
if exist "%APPDATA%\HeKI-AutoProfile" rmdir /S /Q "%APPDATA%\HeKI-AutoProfile"
echo In Edge die Erweiterung entfernen. Optional unbenoetigte PageDeck-Profilkopien in Stream Deck loeschen.
echo Zuvor Profilkopien exportieren, falls sie noch benoetigt werden.
pause
exit /b 0
