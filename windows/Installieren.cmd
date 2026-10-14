@echo off
setlocal
if not defined APPDATA exit /b 1
cd /d "%~dp0"
echo HeKI Auto Profile installieren
echo Bitte Stream Deck ueber das Symbol im Infobereich vollstaendig beenden.
tasklist /FI "IMAGENAME eq StreamDeck.exe" /NH 2>nul | find /I "StreamDeck.exe" >nul
if not errorlevel 1 (
  echo Stream Deck laeuft noch. Beenden und dieses Skript erneut starten.
  pause
  exit /b 1
)
set "HEKI_PLUGIN=%APPDATA%\Elgato\StreamDeck\Plugins\de.heki.autoprofile.sdPlugin"
if exist "%HEKI_PLUGIN%" (
  echo HeKI ist bereits installiert. Bitte Aktualisieren.cmd verwenden.
  pause
  exit /b 1
)
if not exist "streamdeck-plugin\manifest.json" (
  echo Plugin-Dateien fehlen. ZIP vollstaendig in einen lokalen Ordner entpacken.
  pause
  exit /b 1
)
echo Exportierte Profile vorab mit Profile-einbinden.cmd einbinden.
echo Ohne Exportprofil funktioniert die Verbindung, aber kein BBB-Profilwechsel.
pause
mkdir "%APPDATA%\HeKI-AutoProfile" 2>nul
icacls "%APPDATA%\HeKI-AutoProfile" /inheritance:r /grant:r "%USERDOMAIN%\%USERNAME%:(OI)(CI)F" "*S-1-5-18:(OI)(CI)F" >nul
if errorlevel 1 (
  echo Zugriffsschutz konnte nicht gesetzt werden. Installation abgebrochen.
  pause
  exit /b 1
)
robocopy "streamdeck-plugin" "%HEKI_PLUGIN%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
if errorlevel 8 (
  echo Kopieren fehlgeschlagen. Zielordner pruefen.
  pause
  exit /b 1
)
echo Plugin kopiert. Stream Deck starten und Edge-Erweiterung entpackt laden.
echo Anleitung: START-HIER.html
start "" "START-HIER.html"
pause
exit /b 0
