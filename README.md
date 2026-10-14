# HeKI Stream Deck Auto Profile Switcher

Version **1.0.2** – Installation und Profilvorbereitung **ohne separate Node.js-Installation**, Stand 14.10.2026. Abnahmekandidat für Windows und Stream Deck XL.

## Herunterladen

- **[Komplettes ZIP 1.0.2 herunterladen](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/HeKI-AutoProfile-1.0.2.zip)** – Edge-Erweiterung, lokale grafische Profilvorbereitung, Installationspaket und deutsches Handbuch.
- [Basis-Plugin als .streamDeckPlugin](https://github.com/MCInferno79/enaiodashlet/raw/refs/heads/codex/heki-autoprofile-1.0.0/downloads/HeKI-AutoProfile-1.0.2-Basis.streamDeckPlugin) – offizielles CLI-Paket, per Doppelklick installierbar. Enthält noch keine persönlichen Exportprofile; allein damit erfolgt noch kein BBB-Profilwechsel.
- [SHA-256-Prüfsumme des ZIPs](downloads/HeKI-AutoProfile-1.0.2.zip.sha256)

## Update 1.0.2: Kopplungscode

Die Kopplungsoberfläche meldet jetzt jede Code-Anforderung, fehlende Antworten nach fünf Sekunden, Verbindungsabbrüche und einen noch nicht gestarteten lokalen Dienst. Früh eintreffende Antworten werden bis zum Erscheinen des Einstellungsbereichs aufbewahrt. UI-, Plugin- und Stream-Deck-Version stehen direkt unter dem Status. Der vollständige Weg vom echten Button über das SDK bis zum angezeigten, erfolgreich eingelösten Code wurde in Chromium mit simuliertem Stream-Deck-Host geprüft. Der konkrete Ausfall auf dem Windows-Rechner ist damit noch nicht abschließend geklärt.

Für ein Update das neue ZIP entpacken und **mit der neuen Profilvorbereitung alle eigenen Exportprofile erneut einbinden**. Das daraus erzeugte persönliche Paket installieren. Anschließend Stream Deck vollständig beenden, neu starten und die Aktion „Automatik / Kopplung“ auswählen. Wenn weiterhin kein Code erscheint, den angezeigten `PI`-Diagnosecode und die Versionszeile melden; keinen Kopplungscode oder Token weitergeben.

## Auf dem Dienstrechner

**Weder Node.js noch npm, PowerShell oder ein zusätzlicher Dienst müssen installiert werden.** Das Plugin nutzt die von Stream Deck selbst verwaltete Plugin-Laufzeit, wie andere Node-basierte Stream-Deck-Plugins. Stream Deck ab 7.1 mit verfügbarer Node.js-24-Plugin-Laufzeit ist Voraussetzung; für einen Offline-Einsatz muss diese bereits bereitgestellt sein.

1. ZIP vollständig in einen stabilen lokalen Ordner entpacken und `START-HIER.html` lesen.
2. Eine **Kopie** des BBB-Profils in Stream Deck als `.streamDeckProfile` exportieren. Originalprofile unverändert lassen.
3. `Profile-Paket-erstellen.html` in Edge öffnen. Alternativ zuerst die Erweiterung aus `edge-extension` unter `edge://extensions` entpackt laden und in ihren Einstellungen den Link **„Eigene Exportprofile ohne Node.js …“** öffnen.
4. BBB-Export auswählen, Kennung `BBB` und Gerätetyp `Stream Deck XL` beibehalten, **Installationspaket erstellen** und herunterladen.
5. Die erzeugte **`.streamDeckPlugin`-Datei doppelklicken**. Stream Deck übernimmt Installation und Import der Profilkopien.
6. Edge-Erweiterung laden, falls noch nicht geschehen. In einem neuen Einrichtungsprofil die Aktion „Automatik / Kopplung“ platzieren, Code erzeugen und in Edge koppeln.

Die Profilvorbereitung läuft vollständig lokal im Browser. Sie kopiert ausgewählte Exportarchive bytegleich und erstellt ein neues Pluginpaket. Es findet kein Upload statt. Persönliche Pakete können sensible Drittplugin-Settings enthalten und gehören nicht in dieses öffentliche Repository.

Die Regelverwaltung unterstützt BBB, HeKI, Grafana, Speakr und eigene Websites, Hostnamen, Subdomains, Pfade, Prioritäten, Geräteauswahl, Pause sowie Konfigurationsimport/-export. Das offizielle SDK kann nur mitgelieferte Pluginprofile aktivieren; deshalb ist die Einbindung echter Exportprofile erforderlich.

## Nachweis und Grenzen

26 automatisierte Tests sowie Build und offizielle Elgato-Validierung bestehen. Der personalisierte Paketaufbau wurde nach dem Entpacken ebenfalls durch die offizielle CLI validiert. Die grafische Profilvorbereitung wurde mit Auswahl, Download und unveränderter Archivkopie in Chromium geprüft; dafür diente ein statischer Testserver. Das direkte Öffnen lokaler Dateien und das Laden von Erweiterungen sind in dieser Entwicklungsumgebung administrativ gesperrt. Beide Wege müssen auf dem freigegebenen Windows-Rechner geprüft werden.

Die echte Windows-/Edge-/XL-Abnahme und besonders die Übergabe an Outlook bleiben offen. Das SDK bestätigt nur den Versand eines Profilbefehls, nicht das sichtbar aktive Profil. Das Paket ist kein im Marketplace veröffentlichtes oder durch Elgato geprüftes Produkt.

## Nur für Entwickler / Buildrechner

Diese Kommandos laufen auf dem Buildrechner, **nicht auf dem Dienstrechner des Anwenders**:

```cmd
npm ci
npm run verify
npm run test:ui
npm run test:inspector
npm run test:packager
npm run release
```

Buildvoraussetzung: Node.js ab 22. Exakte Versionen stehen im Lockfile. SDK und Laufzeitabhängigkeiten werden ins Plugin gebündelt. `streamdeck pack` der offiziellen Elgato-CLI erzeugt den Basisinstaller. Die Browserseite ergänzt daraus ein neues, unverschlüsseltes lokales ZIP-Installationspaket; installiert wird ausschließlich über Stream Deck. Keine laufenden Profildatenbanken werden bearbeitet.

[Installation](docs/INSTALLATION.md) · [Architektur](docs/ARCHITEKTUR.md) · [Betrieb und Update](docs/BETRIEB.md) · [Sicherheit](docs/SICHERHEIT.md) · [Fehlersuche](docs/FEHLERSUCHE.md) · [Hardware-Abnahme](docs/ABNAHME.md) · [Testbericht](docs/TESTBERICHT.md)
