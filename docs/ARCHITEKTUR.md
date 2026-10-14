# PageDeck: Architektur und Erweiterung

## Ablauf

```text
Aktiver Tab und Fokus in Edge
  → MV3-Service-Worker: Website-Regel → Profilkennung
  → authentifizierte HTTP-Anfrage auf 127.0.0.1:29381
  → Controller: Gerätetyp und Profilkatalog prüfen
  → offizielles Elgato-SDK: vorheriges Profil freigeben, Zielprofil aktivieren
  → Stream Deck zeigt das vollständige native Layout
```

Es ist kein Tastendruck als Auslöser nötig. Der physische Steuerknopf dient ausschließlich der Pause; die Property-Inspector-Oberfläche erzeugt Kopplungscodes. Es gibt keine Webseiten-Tasten, DOM-Injektion oder zusätzliche WebSocket-Aktionsverbindung zum Browser. Die WebSocket-Verbindung zum Stream-Deck-Host bleibt Bestandteil des offiziellen SDK.

| Datei | Aufgabe |
|---|---|
| `src/shared/config.ts` | Regelmodell, Validierung, Host-/Pfadzuordnung, neutrale Voreinstellungen |
| `src/extension/worker.ts` | Browserereignisse, Fokusprüfung, Sequenznummern, lokale HTTP-API |
| `src/extension/options.ts` | Deutsche Regel-, Geräte- und Kopplungsoberfläche |
| `src/plugin/controller.ts` | Serialisierte Profilbefehle, Freigabe, Pause und Gerätetypen |
| `src/plugin/server.ts` | Loopback, Origin-/Tokenprüfung, Kopplung und Lease |
| `src/plugin/index.ts` | Offizielles SDK, Steueraktion, Einstellungen und Datenmigration |
| `src/plugin/inspector.ts` | Inspector-Anfragen mit Request-ID und gepufferter früher Antwort |
| `plugin/ui/pi.js` | SDK-UI-Registrierung, Codeanzeige, Timeout und erneuter Versuch |
| `src/packager/package.ts` | Bytegleiche Exportkopie, Manifest/Katalog und persönlicher Installer |
| `src/packager/ui.ts` | Lokale Datei-Auswahl und Download ohne Node-Installation |

## Profile und Erweiterbarkeit

Die offizielle SDK-Schnittstelle kann nur Profile aktivieren, die im Pluginmanifest registriert sind. Benutzerprofile lassen sich nicht allgemein aufzählen. Die Browser-Paketvorbereitung nutzt daher den mit der offiziellen Elgato-CLI erzeugten Basisinstaller und ergänzt ausschließlich vom Benutzer gewählte Exportarchive. Diese bleiben undurchsichtig und bytegleich. Der Katalog enthält Kennung, Anzeigename, Gerätetyp, SDK-Profilpfad und SHA-256. Manifestprofile sind bearbeitbar, automatisch importierbar und wechseln bei Installation nicht selbständig das aktive Profil.

Zusätzliche Layouts benötigen keinen TypeScript-Code: Export, persönliches Paket mit allen Profilen und höherer Revision, Installation, Website-Regel. Neue Aktionsmöglichkeiten kommen über die nativen Stream-Deck-Aktionen und installierte Drittplugins in die Profile. Für neue Zuordnungsfunktionen sind Regelmodell, Validator, Oberfläche und Matcher gemeinsam zu ändern.

## Zustände und Wiederverbindung

Regeln liegen unter `chrome.storage.local.config`, Kopplung unter `auth`, die monotone Sequenz unter `sequence`. Der aktuelle Status liegt in Session-Storage. Alte 2.0-Felder werden nicht gelöscht, aber nicht ausgewertet. Die technische Plugin-ID bleibt für Updates stabil; Produktname und neuer Datenordner heißen PageDeck.

Das Plugin speichert Kopplung und Pause atomar und serialisiert Dateischreibvorgänge. Bei erstmaligem Start im neuen Datenordner kopiert es vorhandene alte Einstellungen, ohne neue Dateien zu überschreiben. Ereignisprotokolle enthalten ausschließlich feste Codes.

Neue Browserereignisse ersetzen veraltete Berechnungen. Fokus und URL werden vor dem Versand erneut geprüft. Das Plugin akzeptiert nur eine aktuelle Instanzkennung und aufsteigende Sequenzen; Befehle werden serialisiert. Zwischen zwei unterschiedlichen verwalteten Profilen steht immer eine Freigabe. Wiederkehrende gleichartige Ereignisse senden keine doppelten Profilbefehle. Ein Alarm etwa alle 30 Sekunden dient Wiederverbindung und Lease; nach 90 Sekunden ohne gültiges Ereignis wird die Profilfreigabe angefordert. Aufwachen, Gerätetrennung und späterer Dienststart werden berücksichtigt.

## Aussage des Status

Das SDK bestätigt den Versand, nicht das sichtbare Profil. PageDeck kann weder ein aktuell sichtbares beliebiges Benutzerprofil abfragen noch den tatsächlichen Erfolg fremder Profilaktionen bestätigen. Der Cloudtest prüft die SDK-Befehle an einem simulierten Host. Windows-/Edge-/XL-Verhalten muss separat abgenommen werden.
