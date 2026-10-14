# Testbericht und Lieferstatus 1.0.3

Prüfdatum: 14.10.2026. Linux, Node.js 24.19.0 auf dem Buildrechner, TypeScript 5.9.3, Elgato-SDK 3.0.2, CLI 1.10.2. UI-Prüfung mit Chromium 151.0.7922.173. Auf dem Dienstrechner ist keine separate Node.js-Installation mehr erforderlich.

## Erfolgreich ausgeführt

- `npm run check`: strikte TypeScript-Prüfung einschließlich Browser-Paketvorbereitung.
- `npm run build`: ausführbares Pluginbundle, MV3-Erweiterung, offizielle `.streamDeckPlugin`-Basisdatei und lokale Profilvorbereitung. Die Paketvorbereitung liegt auch innerhalb der Erweiterung.
- `npm run validate`: offizielle Elgato-Manifestprüfung des Basisplugins; persönliche Exporte fehlen bewusst.
- `npm test`: **29 Tests bestanden**. Zusätzlich zu den bisherigen Prüfungen werden die Freigabe des Buttons nach Timeout, ein erfolgreicher zweiter Klick, die Antwortadressierung über die UI-Kennung und die unveränderte Dienstbereitschaft bei ausbleibender Antwort geprüft.
- `npm run validate:personalized`: mit derselben Browserlogik ein persönliches Paket mit fiktivem Export erstellt, entpackt und mit der **offiziellen Elgato-CLI** erfolgreich validiert. Das Fixture ist ausdrücklich kein reales Hardwareprofil und wird nicht ausgeliefert.
- SDK-Integration: ausgeführter Workerquellcode mit simulierten chrome.*-Ereignissen → echtes authentifiziertes Loopback-HTTP → echtes offizielles SDK → WebSocket-Befehle an simulierten Stream-Deck-Host. Beobachtet: BBB, Freigabe, HeKI, Freigabe, BBB, Freigabe bei Fokusverlust.
- `npm run test:inspector`: echte Inspector-HTML/JavaScript-Oberfläche in Chromium → echter WebSocket → gebautes Plugin mit offiziellem SDK → im Codefeld angezeigter Zufallscode → erfolgreiches lokales HTTP-Pairing. Hostrouting mit voneinander verschiedenen UI-/Aktionskennungen entsprechend dem Referenzclient. Anfrage vor `propertyInspectorDidAppear`, absichtlich verworfene Code-Anfrage mit PI03, wieder freier Button und anschließend erfolgreicher zweiter Klick ohne Neustart einschließlich HTTP-Kopplung geprüft. Der Stream-Deck-Host ist simuliert; eine reale Windows-Installation wird dadurch nicht ersetzt. Keine Codes oder Tokens im Ereignislog.
- `npm run test:ui`: grafische Optionsseite als lokale Testwebseite mit simuliertem chrome.*, einschließlich Regeln hinzufügen/löschen, speichern und pausieren; keine Seitenfehler.
- `npm run test:packager`: grafische Profilvorbereitung in Chromium über statischen **Testserver**. Dateiauswahl, Fehler bei leerer Auswahl, Paketdownload, Dateiendung, Version, XL-Typ und bytegleiche Profilkopie geprüft. Keine externen HTTP(S)-Anfragen. Auf dem Benutzerrechner benötigt die statische Produktseite keinen Server.

## Offen oder in dieser Umgebung blockiert

- Laden einer tatsächlichen MV3-Erweiterung: durch Browseradministration abgelehnt (`Loading of unpacked extensions is disabled by the administrator`). Kein Umgehen der Richtlinie.
- Direktes Öffnen der lokalen Vorbereitungsseite per file://: `ERR_BLOCKED_BY_ADMINISTRATOR`. Deshalb hier ausschließlich die statische HTTP-Testbereitstellung geprüft. Auf dem Zielrechner kann zusätzlich die Seite innerhalb der erlaubten Erweiterung verwendet werden; ihr tatsächliches Laden ist ebenfalls vor Ort zu prüfen.
- Reales Windows, Doppelklick-/Updateinstallation durch Stream Deck, echte `.streamDeckProfile`-Importdialoge, sichtbarer XL-Profilwechsel, Latenz, flackerfreies Verhalten, Hintergrundstart ohne sichtbare Aktion, Rückkehr zu Outlook und bestehendes Grafana-Plugin: keine entsprechende Hardware/Installation verfügbar. Hardware-Abnahme bleibt offen.
- Echte BBB-/HeKI-/Grafana-Exportprofile wurden nicht bereitgestellt. Die neue Browservorbereitung erlaubt ihre Einbindung vollständig lokal, ohne sie hierher oder in ein öffentliches Repository hochzuladen.

## Fehler und Korrektur 1.0.3

Gemeldet wurden PI03, Oberfläche 1.0.2, Plugin 1.0.2.2 und Stream Deck 7.5.1.22901. Der dauerhafte Button-Lock nach einem Timeout wurde vor der Korrektur mit zwei fehlschlagenden Tests reproduziert. Auch die Anzeige „Lokaler Dienst: nicht bereit“ wurde beim Timeout lokal gesetzt und war kein Nachweis eines Portfehlers. Beide Fehler sind korrigiert.

Unabhängiger Protokollvergleich: Der von Elgato in der [UI-Dokumentation](https://docs.elgato.com/streamdeck/sdk/references/websocket/ui/) empfohlene [sdpi-StreamDeckClient](https://github.com/GeekyEggo/sdpi-components/blob/bfd17677540da403e28ecc442110df77be4306ca/src/stream-deck/stream-deck-client.ts#L169) verwendet für ausgehende UI-Befehle `propertyInspectorUUID`. HeKI nutzte bisher `actionInfo.context`. Die neue Version entspricht dem Referenzclient für Registrierung, Status- und Code-Anforderung. Antworten mit der registrierten UI-Kennung und mit dem Aktionskontext werden akzeptiert; fremde Kontexte werden verworfen. Die bisherige Hostsimulation leitete die Aktionskennung direkt weiter und konnte diese Abweichung daher nicht aufdecken. Die Simulation wurde korrigiert und getrennt vom Referenzvergleich geprüft.

`npm run test:reference -- work/sdpi-reference` bestand mit einer separaten, unveränderten Kopie des Referenzquellcodes auf Commit `bfd17677540da403e28ecc442110df77be4306ca`. Das Skript kompiliert und führt diesen Client mit einem simulierten WebSocket aus und vergleicht seine Nachrichten mit der tatsächlich ausgeführten HeKI-Oberfläche. Das Repository ist nur eine Testabhängigkeit in `work/`, wird nicht mitgeliefert und nicht auf dem Benutzerrechner benötigt. Zum Wiederholen auf dem Buildrechner die angegebene Repositoryrevision separat auschecken.

Der korrigierte Nachrichtenweg erklärt den beobachteten Unterschied zwischen sichtbarem Status und ausbleibender angeforderter Antwort. Der Erfolg auf dem Benutzerrechner muss nach der Installation bestätigt werden; ein realer Stream-Deck-Host ist in dieser Umgebung nicht verfügbar.

## Ergebnis

Die Installation und Profilvorbereitung erfordern auf dem Dienstrechner weder Node/npm noch PowerShell. Das Basisplugin wird mit der offiziellen CLI paketiert. Persönliche Pakete werden lokal im Browser erzeugt und über den normalen Stream-Deck-Installer installiert. Eine Marketplace-Prüfung oder abgeschlossene Windows-/Hardwareabnahme wird nicht behauptet. Die bekannte SDK-Grenze beim Rücksprung zu Outlook bleibt unverändert dokumentiert.
