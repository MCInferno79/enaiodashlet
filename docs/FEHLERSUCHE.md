# Fehlerdiagnose

| Beobachtung | Prüfung / Maßnahme |
|---|---|
| „Lokaler Dienst nicht erreichbar“ | Stream Deck starten. Eigenes Einrichtungsprofil mit Steueraktion anzeigen. In Edge Verbindung testen. Bis etwa 30 Sekunden ohne Browserereignis abwarten. |
| Kein Plugin in der Aktionsliste | Installationspfad und manifest.json prüfen, Stream Deck vollständig neu starten; Mindestversion 7.1 und vorhandene Node.js-24-Laufzeit prüfen. Unternehmensfreigaben beachten. |
| „Profil fehlt“ trotz vorhandenem Benutzerprofil BBB | Der Benutzerprofilname genügt nicht. Eine neue XL-Kopie exportieren, mit Kennung BBB / Typ 2 in das Paket einbinden und eigenes Plugin aktualisieren. |
| Nach Installation noch kein Umschalten | Katalog muss Exportprofile enthalten. Importdialog im Host bestätigen, Erweiterung koppeln, Pause prüfen, gewünschten Tab in den Vordergrund bringen. |
| „Kopplung fehlt oder wurde erneuert“ | Neuer Code im Inspector, danach in Edge koppeln. Prüfen, ob ein zweites Browserprofil den ersten Token ersetzt hat oder der Erweiterungspfad verändert wurde. |
| Kopplungscode abgelaufen | Neuen Code erzeugen; zwei Minuten Gültigkeit. Nach fünf Fehlversuchen eine Minute warten. |
| BBB passt versehentlich auf fremde Domain | Mitgelieferte Tests und Regeln prüfen. Nur technische Hostnamen, keine Textsuche auf URL oder Fenstertitel. `bbb.herten.de.example.com` muss unpassend sein. |
| Anderes Edge-Fenster entscheidet | Prüfen, welches Fenster tatsächlich fokussiert ist. Nur der aktive Tab des fokussierten Fensters zählt. Optionsseite selbst ist eine unbekannte/interne Seite. |
| Smart Profile für Outlook erscheint nicht | Automatik pausieren, neutrales Profil im Host auswählen. Hardwaretest der dokumentierten Freigabe durchführen; die API garantiert kein erneutes Smart-Profile-Ereignis. Keine undokumentierten mehrfachen Rücksprungkommandos verwenden. |
| Bearbeitung springt zurück | Vor Profilbearbeitung pausieren. Das SDK bietet keine allgemeine Abfrage „Benutzer bearbeitet gerade irgendein Profil“. |
| Pause lässt sich nicht aufheben | Edge-Pause und Plugin-Pause getrennt prüfen. „Pause am Stream Deck aufheben“ zusätzlich betätigen. |
| Stream Deck neu gestartet, falscher Rücksprung | Geplante Neustarts bei pausierter Automatik und neutralem Profil durchführen. Nach hartem Absturz ist der historische Anker über die API nicht rekonstruierbar. |
| Nach Update alte Tastenbelegung | Bearbeitbare importierte Kopien werden nicht zwangsläufig durch Archivvorlagen ersetzt. Kopie über die Oberfläche neu importieren oder neue Profilkennung/Version verwenden. Originale nicht ersetzen. |
| Port belegt | In CMD `netstat -ano` prüfen. Keine zweite HeKI-Installation parallel starten. Plugin versucht die Bindung mit begrenztem Backoff erneut. Einen fremden Prozess nicht ungeprüft beenden. |
| Erweiterung kann nicht geladen werden | `edge://policy` bzw. IT-Freigaben prüfen. Entwicklermodus allein überstimmt keine Administrationsrichtlinie. Richtlinien nicht umgehen. |
| Lokaler Netzwerkzugriff blockiert | Browsermeldung und Edge-Richtlinien zur lokalen Kommunikation prüfen; für diese Erweiterung entsprechend IT-Vorgaben freigeben. Keine globalen Sicherheitsfunktionen abschalten. |
| Grafana-Aktion funktioniert nicht | Ursprüngliches Grafana-Plugin installiert lassen. Dessen Anmeldung/globalen Settings unabhängig vom Profilexport prüfen. HeKI verändert sie nicht. |

## Lokale Logs

Im Explorer `%APPDATA%\HeKI-AutoProfile` öffnen. `service.log` enthält beispielsweise `START`, `PROFILE_COMMAND_SENT`, `PROFILE_RELEASE_SENT`, `LOCAL_PORT_UNAVAILABLE`. Ein gesendeter Befehl ist keine Hardwarebestätigung. SDK-Fehlerlogs liegen gegebenenfalls im eigenen Plugin-Unterordner `logs`.

Bei einer Supportanfrage genügen zunächst Softwareversionen, Gerätetyp/Raster, fester Ereigniscode und der betroffene Abnahmeschritt. **pairing.json, Browserprofildaten und echte Exportprofile nicht unkontrolliert weitergeben.**

## Entwicklungsprüfung in CMD

Vor den HTTP-/SDK-Integrationstests Stream Deck vollständig beenden, damit der Testport 29381 frei ist. Die Tests verwenden ausschließlich eigene temporäre Verzeichnisse und fiktive Profileinträge; sie importieren keine Profile in die echte Stream-Deck-Software.

```cmd
cd source
npm ci
npm run check
npm run build
npm test
npm run validate
```

Für einen UI-Test ist ein verfügbarer Chromium-Testbrowser erforderlich. Beispiel:

```cmd
set "HEKI_BROWSER_PATH=C:\FreigegebeneTools\Chromium\chrome.exe"
npm run test:ui
npm run test:browser
```

`test:ui` prüft die Optionsseite mit simulierten Browser-APIs. `test:browser` benötigt die Erlaubnis, eine tatsächliche entpackte Erweiterung im Testbrowser zu laden. In der gelieferten Cloud-Umgebung ist genau dies administrativ gesperrt; deshalb wird dieser Test dort nicht als bestanden ausgewiesen. Tests nutzen ausschließlich fiktive Navigationen und einen simulierten Stream-Deck-Host.
