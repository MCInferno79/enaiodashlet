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
set "HEKI_PLUGIN=%APPDATA%\Elgato\StreamDeck\Plugins\de.heki.autoprofile.sdPlugin"
if not exist "%HEKI_PLUGIN%\manifest.json" (
  echo Keine bestehende HeKI-Installation. Installieren.cmd verwenden.
  pause
  exit /b 1
)
if not exist "streamdeck-plugin\manifest.json" exit /b 1
if not exist "streamdeck-plugin\profiles\catalog.json" exit /b 1
echo Vor dem Update: bearbeitete Plugin-Profile in Stream Deck exportieren und Regeln sichern.
echo Die Paket-Exportprofile jetzt mit Profile-einbinden.cmd vorbereiten.
echo Das Update ersetzt ausschliesslich den eigenen Plugin-Ordner.
pause
set "HEKI_BACKUP=%LOCALAPPDATA%\HeKI-AutoProfile-Backups\backup-%RANDOM%-%RANDOM%"
mkdir "%HEKI_BACKUP%" 2>nul
robocopy "%HEKI_PLUGIN%" "%HEKI_BACKUP%\plugin" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
if errorlevel 8 exit /b 1
if exist "%APPDATA%\HeKI-AutoProfile" (
  echo Kopplungsschluessel werden nicht in die Paketsicherung kopiert.
)
rem Keep old files not referenced by the new manifest; never delete profile databases.
robocopy "streamdeck-plugin" "%HEKI_PLUGIN%" /E /R:1 /W:1 /NFL /NDL /NJH /NJS
if errorlevel 8 (
  echo Update fehlgeschlagen. Sicherung: %HEKI_BACKUP%
  pause
  exit /b 1
)
echo Aktualisiert. Sicherung: %HEKI_BACKUP%
echo Stream Deck und die Edge-Erweiterung neu laden.
pause
exit /b 0
