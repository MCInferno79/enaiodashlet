# PageDeck

**Version 2.1.0 · Das vollständige Stream-Deck-Layout wechselt mit der aktiven Webseite.**

PageDeck erkennt den aktiven Tab im fokussierten Microsoft-Edge-Fenster und aktiviert automatisch das zugeordnete vollständige Stream-Deck-Profil. Sie erstellen die Layouts mit Ihren Hotkeys, Texteingaben, Makros und Plugin-Aktionen direkt in Stream Deck. Zum Wechseln ist kein Tastendruck nötig. Es sind keine Fachanwendungen oder aktiven Webseitenregeln vorgegeben.

## Herunterladen

- **[PageDeck 2.1.0 – komplettes ZIP](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/PageDeck-2.1.0.zip)** – lokale Profilvorbereitung, Edge-Erweiterung, Anleitung und Quellcode.
- [SHA-256 des ZIPs](downloads/PageDeck-2.1.0.zip.sha256)

Auf Ihrem PC ist **keine separate Node.js-Installation** nötig. Stream Deck ab 7.1 stellt die Plugin-Laufzeit bereit. Edge benötigt Chromium ab 120 sowie die Freigabe zum Laden entpackter Erweiterungen.

## Einrichtung

1. ZIP vollständig entpacken und `START-HIER.html` öffnen.
2. Ihre gewünschten Profile in Stream Deck erstellen, zur Sicherung duplizieren und die Kopien als `.streamDeckProfile` exportieren.
3. `Profile-Paket-erstellen.html` in Edge öffnen, Exporte auswählen, eigene Profilkennungen vergeben und Gerätetyp **Stream Deck XL · 32 Tasten** wählen. Alle benötigten Profile in dasselbe Paket aufnehmen.
4. Das erzeugte persönliche `.streamDeckPlugin` herunterladen und per Doppelklick über Stream Deck installieren. Die Profilkopien werden dabei eingebunden. Bereits benötigte Drittplugins müssen installiert sein.
5. Unter `edge://extensions` die Erweiterung aus `edge-extension` entpackt laden. In einem Einrichtungsprofil die Aktion **PageDeck → Automatik / Kopplung** platzieren, im Editor auswählen und im Einstellungsbereich einen Kopplungscode erzeugen. In den PageDeck-Einstellungen in Edge damit koppeln.
6. In Edge **„+ Neue Regel“** wählen, Domain oder Domain/Pfad eintragen und ein eingebundenes Profil auswählen. Speichern und die Webseite in den Vordergrund bringen: Das komplette Layout wechselt automatisch.

Die Seite zur Profilvorbereitung arbeitet vollständig lokal, ohne Upload oder zusätzliche Programme. Falls lokale HTML-Dateien gesperrt sind, lässt sich dieselbe Seite über die Einstellungen der geladenen Edge-Erweiterung öffnen. Das zusätzlich enthaltene **Basisplugin** enthält noch keine persönlichen Profile; für den normalen Betrieb installieren Sie das selbst erzeugte Paket.

## Regeln und Layouts ändern

Domainregeln unterstützen exakte Hosts, `*.example.org`, optionale Pfade, Prioritäten und eine Geräteauswahl. Unbekannte Seiten können das verwaltete Profil freigeben, beibehalten oder ein eingebundenes Standardprofil aktivieren. Beim Verlassen von Edge wird die Freigabe angefordert.

Regeln für bereits eingebundene Profile ändern Sie direkt in Edge. Für zusätzliche Profile oder überarbeitete Exporte erzeugen Sie erneut ein persönliches Paket mit höherer Revision und installieren es. Wählen Sie dabei **alle weiter benötigten Exporte** aus. Bereits in Stream Deck bearbeitete Profilkopien vorher neu exportieren. Während der Profilbearbeitung die Automatik pausieren.

Die [offizielle Elgato-Schnittstelle](https://docs.elgato.com/streamdeck/sdk/guides/profiles/#switching-to-a-profile) kann nur im Pluginpaket registrierte Profile aktivieren. Deshalb sind Export und persönliche Paketvorbereitung erforderlich. Sie kann den tatsächlichen Profilwechsel auch nicht bestätigen; der Status zeigt den Befehlsversand.

## Update

Version 2.1 stellt den vollständigen automatischen Profilwechsel wieder her. Die Webseiten-Tasten aus 2.0 werden nicht mehr angeboten. Erstellen Sie mit der neuen Profilvorbereitung ein persönliches Paket und installieren Sie dieses. Die bloße Installation des leeren Basisplugins reicht für Layoutwechsel nicht aus.

Edge-Dateien am bisherigen Erweiterungsort ersetzen und die Erweiterung neu laden. Stream Deck vollständig beenden und neu starten. Bestehende Profilregeln und die Kopplung bleiben bei unveränderter Erweiterungs-ID erhalten. Frühere 2.0-Tastenschritte werden nicht in native Profile umgewandelt; die Layouts richten Sie in Stream Deck ein. Die technischen Plugin-/Aktionskennungen bleiben für Updates stabil. Produktname, Oberfläche und neuer Datenordner heißen PageDeck.

## Prüfungen

Automatisierte Prüfungen für Regeln, Kopplung, Update, offiziellen SDK-Befehlsversand und Paketvorbereitung sowie die offizielle Elgato-Validierung sind im [Testbericht](docs/TESTBERICHT.md) beschrieben. Windows, Edge und das echte XL-Gerät müssen vor Ort abgenommen werden. Der Stream-Deck-Host ist in den Integrationstests simuliert; echte Erweiterungsinstallation ist in der Entwicklungsumgebung administrativ gesperrt.

[Installation](docs/INSTALLATION.md) · [Betrieb](docs/BETRIEB.md) · [Architektur](docs/ARCHITEKTUR.md) · [Sicherheit](docs/SICHERHEIT.md) · [Fehlersuche](docs/FEHLERSUCHE.md) · [Abnahme](docs/ABNAHME.md) · [Testbericht](docs/TESTBERICHT.md)

## Nur auf dem Buildrechner

```sh
npm ci
npm run verify
npm run test:ui
npm run test:packager
npm run test:inspector
npm run release
```

Node.js ab 22 und die Entwicklerwerkzeuge werden ausschließlich auf dem Buildrechner benötigt. Browserprüfungen benötigen Chromium; optional `PAGEDECK_BROWSER_PATH` setzen. `test:browser` benötigt eine Umgebung, in der echte Erweiterungen geladen werden dürfen. Exakte Abhängigkeiten stehen im Lockfile. Auf Ihrem PC installiert Stream Deck das erzeugte Plugin wie andere lokal bereitgestellte Plugins; eine Marketplace-Veröffentlichung ist nicht enthalten.
