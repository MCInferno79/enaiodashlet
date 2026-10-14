# Testbericht und Lieferstatus

Prüfdatum: 14.10.2026. Plattform: Linux, Node.js 24.19.0, TypeScript 5.9.3, offizielles Elgato-SDK 3.0.2. UI-Prüfung mit Chromium 151.0.7922.173.

## Erfolgreich ausgeführt

- `npm run check`: vollständige strikte TypeScript-Prüfung.
- `npm run build`: ausführbares Plugin-Bundle einschließlich SDK und WebSocket-Abhängigkeiten, MV3-Erweiterung und lokale Ressourcen.
- `npm run validate`: offizielle Elgato-CLI, gültiges Basis-Pluginmanifest. Der Basiskatalog enthält absichtlich keine nicht bereitgestellten Benutzerprofile.
- `npm test`: **16 Tests bestanden**, keine übersprungenen Tests. URL-Hostgrenzen, Wildcards/Pfade, Prioritäten, deaktivierte Regeln, Schema-/Eingabeprüfung, Gerätefilter, Pause, Standardprofil, Serialisierung, SDK-Fehler, Lease-Controller, Exportkopie, Auth/Origin/Host, Replay-Schutz, Kopplungslimit und Worker-Wiederanlauf abgedeckt.
- Integrationsfall: ausgeführter Edge-Service-Worker-Quellcode mit simulierten `chrome.*`-Ereignissen → echte authentifizierte Loopback-HTTP-Anfragen → gestartetes Plugin mit **echtem offiziellen SDK** → echte WebSocket-Nachrichten an simulierten Stream-Deck-Host. Beobachtete Reihenfolge: BBB, Freigabe, HeKI, Freigabe, BBB, Freigabe bei Fokusverlust. Damit ist die implementierte Ereignis-/Befehlskette nachgewiesen, nicht ein sichtbarer Hardwarewechsel.
- `npm run test:ui`: tatsächliche HTML-/JS-Optionsoberfläche als lokale Seite in Chromium; Browser-APIs simuliert. Hinzufügen/Löschen, Speichern und Pause geprüft, keine Seitenfehler. Vorschau im Paket als `Optionsvorschau.png` gekennzeichnet.
- Zwei aufeinanderfolgende Release-Erstellungen aus denselben Eingaben lieferten identische SHA-256-Prüfsummen. ZIP-Einträge sind sortiert und besitzen feste Zeitstempel; die getestete Vorschau wird als statisches Asset mit den Quellen ausgeliefert.

## Nicht ausgeführt bzw. blockiert

- Vollständiger Test einer geladenen MV3-Erweiterung: `npm run test:browser` wurde versucht. Die Browseradministration dieser Umgebung lehnt das Laden entpackter Erweiterungen ab: `Loading of unpacked extensions is disabled by the administrator.` Die Richtlinie wurde nicht umgangen. Der ausführbare Test ist enthalten und kann in einem freigegebenen Chromium-Testbrowser erneut laufen.
- Reales Microsoft Edge unter Windows, Stream-Deck-Anwendung, echter XL-Profilimport, tatsächlich sichtbarer Profilwechsel, Untersekundenlatenz, Hintergrundstart des Hostplugins, Smart-Profile-Rückkehr, Abwesenheit sichtbaren Flackerns und vorhandenes Grafana-Plugin: kein Zugriff auf diese Hardware/Installation. Alle Fälle sind im Hardware-Abnahmeprotokoll offen.
- Windows-Batch-/ACL-Ausführung: in dieser Linux-Umgebung nicht ausführbar; Skripte wurden gelesen und auf ausschließlich eigene Zielordner beschränkt. Administrative Ausführung ist für eine normale benutzerlokale Installation nicht vorgesehen.
- Echte BBB-/HeKI-/Grafana-Exportarchive: nicht bereitgestellt. Der Assistent ist auf bytegleiche Kopie und Manifestregistrierung getestet; die Testdatei ist ausdrücklich ein opakes Fixture und wird **nicht** als echtes Profil ausgeliefert.

## Ergebnis

Implementierung, reproduzierbarer Quellbuild und lokales Release-Paket liegen vor. Die lieferbare Version ist ein **Abnahmekandidat mit funktionsfähiger SDK-Befehlskette**. Für die vollständige Zielerfüllung sind die echten Exportprofile und die Windows-/XL-Abnahme erforderlich. Besonders die Freigabe an Outlook und der Pluginstart ohne sichtbare Aktion dürfen nicht ohne Hardwareprüfung als garantiert gelten.
