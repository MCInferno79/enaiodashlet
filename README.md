# HeKI Stream Deck Auto Profile Switcher

Version 1.0.0 – **implementierter Abnahmekandidat für Windows / Stream Deck XL**, Stand 14.10.2026.

## Fertiges ZIP herunterladen

**[HeKI-AutoProfile-1.0.0.zip direkt herunterladen](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/HeKI-AutoProfile-1.0.0.zip)** (ca. 711 KiB)

Alternativ [die ZIP-Datei auf GitHub öffnen](downloads/HeKI-AutoProfile-1.0.0.zip) und **Download raw file** betätigen.

Das ZIP vollständig entpacken und darin **START-HIER.html** öffnen. Es enthält die fertig gebaute Edge-Erweiterung, das Stream-Deck-Plugin, die CMD-Assistenten und das deutsche Handbuch. Für die Installation dieses vorbereiteten Pakets ist kein npm-Build nötig. Für den ersten sichtbaren BBB-Wechsel muss eine in Stream Deck exportierte XL-Profilkopie mit dem Assistenten eingebunden werden.

[SHA-256-Prüfsumme](downloads/HeKI-AutoProfile-1.0.0.zip.sha256) · [Installationsanleitung](docs/INSTALLATION.md) · [Testbericht und offene Hardwareabnahme](docs/TESTBERICHT.md)

Die Edge-Erweiterung erkennt die URL des aktiven Tabs im fokussierten Edge-Fenster. Ein lokales Plugin schaltet über das offizielle Elgato-SDK auf ein mitgeliefertes Profil um. Die initialen Regeln für BBB, HeKI, HeKI/Grafana und Speakr sind über die deutsche Oberfläche änderbar.

**Für einen sichtbaren BBB-Profilwechsel muss zuerst ein echtes, in Stream Deck exportiertes XL-Profil eingebunden werden. Solche Benutzerexporte wurden nicht bereitgestellt und sind daher nicht im Paket enthalten.** Der Assistent kopiert die Dateien unverändert. Es werden keine Profile anhand undokumentierter interner Formate erzeugt.

16 automatisierte Tests, TypeScript, Build und offizielle Elgato-Manifestprüfung bestanden. Eine echte lokale HTTP-/SDK-WebSocket-Kette ist getestet; Browserereignisse und Stream-Deck-Host sind dabei simuliert. Die Optionsoberfläche wurde in Chromium geprüft. Das Laden einer tatsächlichen Erweiterung ist in der Entwicklungsumgebung durch eine Administrationsrichtlinie blockiert. **Der reale Windows-/Edge-/XL-Test und die Outlook-Profilfreigabe stehen aus. Keine Behauptung einer abgeschlossenen Produktionsabnahme.**

## Installation

Im Release-Paket `START-HIER.html` öffnen. Vollständige Schritte stehen in [docs/INSTALLATION.md](docs/INSTALLATION.md).

1. In Stream Deck eine Kopie des BBB-Profils für XL erstellen und diese exportieren.
2. `Profile-einbinden.cmd` starten, Exportdatei wählen, Kennung `BBB`, Gerätetyp `2` verwenden.
3. Stream Deck vollständig beenden; `Installieren.cmd` ausführen.
4. `edge://extensions` → Entwicklermodus → Entpackte Erweiterung laden → `edge-extension`.
5. In einem neuen Einrichtungsprofil die Aktion „Automatik / Kopplung“ platzieren, Code erzeugen, in Edge koppeln.
6. BBB öffnen und [Hardware-Abnahme](docs/ABNAHME.md) durchführen.

Für die Profilvorbereitung wird Node.js ab 22 benötigt. Für den Betrieb verwendet das Plugin die von Stream Deck bereitgestellte Node.js-24-Laufzeit. Diese muss vor einem vollständig offline durchgeführten Einsatz bereits vorhanden sein. Keine PowerShell, kein Windows-Dienst, keine Cloud-Verbindung der Lösung.

## Entwicklung

```cmd
npm ci
npm run check
npm run build
npm test
npm run validate
npm run release
```

`npm run test:ui` prüft die UI als lokale Webseite mit simuliertem `chrome.*`. `npm run test:browser` lädt die tatsächliche Erweiterung in einen freigegebenen Chromium-Testbrowser; `HEKI_BROWSER_PATH` kann auf dessen ausführbare Datei zeigen. Aktuelle gebrandete Chrome-/Edge-Versionen unterstützen die zum Test verwendeten Sideload-Flags teils nicht; das ist unabhängig vom manuellen Laden über `edge://extensions`.

Details: [Architektur und offizielle Quellen](docs/ARCHITEKTUR.md), [Betrieb](docs/BETRIEB.md), [Sicherheit](docs/SICHERHEIT.md), [Fehlersuche](docs/FEHLERSUCHE.md), [Testbericht](docs/TESTBERICHT.md).
