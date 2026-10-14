# PageDeck

**Version 2.0.0 · Ihre Webseiten. Ihre Tasten. Ihre Abläufe.**

PageDeck verbindet ein selbst erstelltes Stream-Deck-Profil mit frei konfigurierbaren Webseiten-Aktionen in Microsoft Edge. Die PageDeck-Tasten erhalten je nach aktiver Webseite andere Beschriftungen und Funktionen. Neue Webseiten und Abläufe ergänzen Sie in Edge; dafür brauchen Sie weder Profilexporte noch ein neues Pluginpaket.

## Herunterladen

- **[PageDeck 2.0.0 – komplettes ZIP](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/PageDeck-2.0.0.zip)** – Stream-Deck-Installer, Edge-Erweiterung, Anleitung und Quellcode.
- **[PageDeck-2.0.0.streamDeckPlugin](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/PageDeck-2.0.0.streamDeckPlugin)** – per Doppelklick direkt über Stream Deck installieren.
- [SHA-256 des ZIPs](downloads/PageDeck-2.0.0.zip.sha256)

Auf dem Benutzerrechner ist **keine separate Node.js-Installation** erforderlich. Stream Deck ab 7.1 stellt die Node.js-24-Plugin-Laufzeit bereit. Die Erweiterung benötigt Edge ab Chromium 120 und die Freigabe zum Laden entpackter Erweiterungen.

## Einrichtung

1. ZIP vollständig entpacken. `PageDeck-2.0.0.streamDeckPlugin` doppelklicken und in Stream Deck installieren.
2. Unter `edge://extensions` den Ordner `edge-extension` entpackt laden bzw. die bisherige Erweiterung am selben Ort aktualisieren und neu laden.
3. In Stream Deck ein eigenes Profil erstellen oder ein vorhandenes verwenden. Eine PageDeck-Aktion **„Verbindung / Pause“** platzieren, auswählen und einen Kopplungscode erzeugen. In den PageDeck-Einstellungen in Edge damit koppeln.
4. **„Webseiten-Taste“** auf die gewünschten Deck-Tasten ziehen. Die Tastennummer 1–32 wird anfangs aus der Position abgeleitet und kann im Einstellungsbereich geändert werden.
5. In Edge **„+ Webseite“** wählen, Domain oder Domain/Pfad eintragen, eine Taste mit derselben Nummer hinzufügen und deren Schritte einrichten. Für Seitenzugriffe **„Website freigeben“** wählen und speichern.
6. Die konfigurierte Webseite in den Vordergrund bringen und die Deck-Taste drücken. Normale Stream-Deck-Aktionen können Sie daneben weiterhin verwenden.

## Aktionen

| Aktion | Einstellung |
|---|---|
| Element klicken | CSS-Selektor, z. B. `#speichern` |
| Feld ausfüllen | Selektor und Text; ersetzt den Feldinhalt |
| Text einfügen | Text; ohne Selektor im fokussierten Eingabefeld |
| Seiten-Tastenkürzel | z. B. `Control+Shift+k`, `Enter`; optional Zielselektor |
| Scrollen | Pixelzahl, z. B. `600` oder `-600` |
| Seite öffnen | vollständige HTTP(S)-Adresse; letzter Schritt der Folge |

Je Webseite sind 32 Tasten mit jeweils bis zu zehn Schritten möglich. Exakte Domains, Subdomains, Pfade, Prioritäten, Pause sowie JSON-Import/-Export werden unterstützt. Es gibt keine vorgegebenen Fachanwendungen oder aktiven Beispielregeln.

**Seiten-Tastenkürzel sind synthetische DOM-Ereignisse.** Windows-/Browser-Hotkeys konfigurieren Sie als normale Hotkey-Aktion direkt in Stream Deck. Manche Webanwendungen akzeptieren synthetische Ereignisse nicht; geschützte Browserseiten, fremde Frames und besondere Editoren sind nicht allgemein steuerbar. CSS-Selektoren werden ausdrücklich konfiguriert; ein visueller Elementwähler ist noch nicht enthalten.

## Eigene Stream-Deck-Profile

Sie bearbeiten Ihr Deck-Profil und alle übrigen Tasten weiterhin direkt in Stream Deck. PageDeck verändert nur die eigenen Webseiten-Tasten.

Die [offizielle Elgato-Schnittstelle](https://docs.elgato.com/streamdeck/sdk/guides/profiles/#switching-to-a-profile) kann frei erstellte Benutzerprofile **weder auflisten noch direkt aktivieren**. Deshalb basiert der neue Betrieb auf wechselnden Tastenbelegungen innerhalb Ihres Profils. Der bisherige automatische Wechsel eingebundener Exportprofile bleibt auf einer separaten Einstellungsseite als ausdrücklich zu aktivierende Zusatzfunktion erhalten.

## Update von 1.x

PageDeck ist der neue Produktname. Die technischen Plugin-/Aktionskennungen und der vorhandene Datenordner bleiben für das Update erhalten, damit bestehende Steueraktionen und Kopplungsdaten weiterverwendet werden können. Die bisherigen Domainregeln bleiben gespeichert; ihr automatischer Profilwechsel ist ab 2.0 standardmäßig ausgeschaltet. Bereits importierte Benutzerprofile werden nicht gelöscht.

Das neue vollständige Plugin direkt installieren; für den gewählten Webseiten-Modus **kein persönliches Profilpaket neu erzeugen**. Edge-Dateien am bisherigen Ort aktualisieren und neu laden, Stream Deck vollständig beenden und neu starten. Danach die neuen Webseiten-Tasten einrichten. Für deren Konfiguration öffnet PageDeck jetzt die neue Webseiten-Oberfläche.

## Nachweis und Grenzen

TypeScript, automatisierte Kernprüfungen, offizielle Elgato-Validierung, Kopplungsprüfung und Chromium-Tests für Webseiten-Aktionen und die neue Oberfläche sind im [Testbericht](docs/TESTBERICHT.md) dokumentiert. Dabei sind Stream-Deck-Host und Chrome-Erweiterungs-APIs teilweise simuliert. Echtes Windows/Edge/XL und die Installation als entpackte Erweiterung müssen vor Ort geprüft werden; das tatsächliche Laden von Erweiterungen ist in dieser Entwicklungsumgebung administrativ blockiert.

[Installation](docs/INSTALLATION.md) · [Bedienung](docs/BETRIEB.md) · [Architektur und Erweiterung](docs/ARCHITEKTUR.md) · [Sicherheit](docs/SICHERHEIT.md) · [Fehlersuche](docs/FEHLERSUCHE.md) · [Abnahme](docs/ABNAHME.md) · [Testbericht](docs/TESTBERICHT.md)

## Nur auf dem Buildrechner

```sh
npm ci
npm run verify
npm run test:web
npm run test:workspaces-ui
npm run test:inspector
npm run test:ui
npm run test:packager
npm run release
```

Node.js ab 22 wird ausschließlich auf dem Buildrechner benötigt. Browserprüfungen benötigen Chromium; optional `HEKI_BROWSER_PATH` setzen. `test:browser` benötigt eine Umgebung, die das Laden echter Erweiterungen erlaubt. Exakte Abhängigkeiten stehen im Lockfile. Installiert wird das Plugin über den normalen Stream-Deck-Installer.
