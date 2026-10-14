# Testbericht und Lieferstatus 1.0.2

Prüfdatum: 14.10.2026. Linux, Node.js 24.19.0 auf dem Buildrechner, TypeScript 5.9.3, Elgato-SDK 3.0.2, CLI 1.10.2. UI-Prüfung mit Chromium 151.0.7922.173. Auf dem Dienstrechner ist keine separate Node.js-Installation mehr erforderlich.

## Erfolgreich ausgeführt

- `npm run check`: strikte TypeScript-Prüfung einschließlich Browser-Paketvorbereitung.
- `npm run build`: ausführbares Pluginbundle, MV3-Erweiterung, offizielle `.streamDeckPlugin`-Basisdatei und lokale Profilvorbereitung. Die Paketvorbereitung liegt auch innerhalb der Erweiterung.
- `npm run validate`: offizielle Elgato-Manifestprüfung des Basisplugins; persönliche Exporte fehlen bewusst.
- `npm test`: **26 Tests bestanden**. Zusätzlich zu den bisherigen 19 Prüfungen sieben Tests für Kopplungsantworten, frühe Inspector-Anfragen, Dienstfehler, UI-Registrierung/Aktionskontext, Codeanzeige und Ablauf, unbeantwortete Anfragen sowie Verbindungsabbruch und Wiederverbindung.
- `npm run validate:personalized`: mit derselben Browserlogik ein persönliches Paket mit fiktivem Export erstellt, entpackt und mit der **offiziellen Elgato-CLI** erfolgreich validiert. Das Fixture ist ausdrücklich kein reales Hardwareprofil und wird nicht ausgeliefert.
- SDK-Integration: ausgeführter Workerquellcode mit simulierten chrome.*-Ereignissen → echtes authentifiziertes Loopback-HTTP → echtes offizielles SDK → WebSocket-Befehle an simulierten Stream-Deck-Host. Beobachtet: BBB, Freigabe, HeKI, Freigabe, BBB, Freigabe bei Fokusverlust.
- `npm run test:inspector`: echte Inspector-HTML/JavaScript-Oberfläche in Chromium → echter WebSocket → gebautes Plugin mit offiziellem SDK → im Codefeld angezeigter Zufallscode → erfolgreiches lokales HTTP-Pairing. Auch Anfrage vor `propertyInspectorDidAppear` und „Bereit, aber Code-Anfrage ohne Antwort“ mit sichtbarer PI03-Diagnose geprüft. Der Stream-Deck-Host ist simuliert; eine reale Windows-Installation wird dadurch nicht ersetzt. Keine Codes oder Tokens im Ereignislog.
- `npm run test:ui`: grafische Optionsseite als lokale Testwebseite mit simuliertem chrome.*, einschließlich Regeln hinzufügen/löschen, speichern und pausieren; keine Seitenfehler.
- `npm run test:packager`: grafische Profilvorbereitung in Chromium über statischen **Testserver**. Dateiauswahl, Fehler bei leerer Auswahl, Paketdownload, Dateiendung, Version, XL-Typ und bytegleiche Profilkopie geprüft. Keine externen HTTP(S)-Anfragen. Auf dem Benutzerrechner benötigt die statische Produktseite keinen Server.

## Offen oder in dieser Umgebung blockiert

- Laden einer tatsächlichen MV3-Erweiterung: durch Browseradministration abgelehnt (`Loading of unpacked extensions is disabled by the administrator`). Kein Umgehen der Richtlinie.
- Direktes Öffnen der lokalen Vorbereitungsseite per file://: `ERR_BLOCKED_BY_ADMINISTRATOR`. Deshalb hier ausschließlich die statische HTTP-Testbereitstellung geprüft. Auf dem Zielrechner kann zusätzlich die Seite innerhalb der erlaubten Erweiterung verwendet werden; ihr tatsächliches Laden ist ebenfalls vor Ort zu prüfen.
- Reales Windows, Doppelklick-/Updateinstallation durch Stream Deck, echte `.streamDeckProfile`-Importdialoge, sichtbarer XL-Profilwechsel, Latenz, flackerfreies Verhalten, Hintergrundstart ohne sichtbare Aktion, Rückkehr zu Outlook und bestehendes Grafana-Plugin: keine entsprechende Hardware/Installation verfügbar. Hardware-Abnahme bleibt offen.
- Echte BBB-/HeKI-/Grafana-Exportprofile wurden nicht bereitgestellt. Die neue Browservorbereitung erlaubt ihre Einbindung vollständig lokal, ohne sie hierher oder in ein öffentliches Repository hochzuladen.

## Anlass 1.0.2

Gemeldet wurde „Bereit/Gerätedaten sichtbar, aber kein Kopplungscode“. Für die ursprüngliche Version ist die genaue Ursache auf dem Benutzerrechner noch offen. Gefunden wurden fehlende Rückmeldung bei still verworfenen UI-Anfragen sowie fehlende Zeitüberschreitungs-/Verbindungsbehandlung. Die neue Version korrigiert diese Pfade und ergänzt Diagnose und Ereigniscodes. Ein bestimmter Windows-/SDK-Fehler als alleinige Ursache wird nicht behauptet.

## Ergebnis

Die Installation und Profilvorbereitung erfordern auf dem Dienstrechner weder Node/npm noch PowerShell. Das Basisplugin wird mit der offiziellen CLI paketiert. Persönliche Pakete werden lokal im Browser erzeugt und über den normalen Stream-Deck-Installer installiert. Eine Marketplace-Prüfung oder abgeschlossene Windows-/Hardwareabnahme wird nicht behauptet. Die bekannte SDK-Grenze beim Rücksprung zu Outlook bleibt unverändert dokumentiert.
