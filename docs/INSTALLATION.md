# Installation ohne separate Node.js-Installation

## Voraussetzungen

- Windows 10/11, Microsoft Edge ab Chromium-Version 120, Stream Deck ab 7.1. Die von der IT freigegebene aktuelle Version verwenden.
- Stream Deck XL, SDK-Typ `2`, 8 Spalten × 4 Zeilen. Andere Typen benötigen passende eigene Exportprofile. Keine Beschränkung auf 15 Tasten.
- Stream Deck stellt seine **eigene Node.js-24-Plugin-Laufzeit** bereit. Eine systemweite Node.js-Installation ist nicht erforderlich. Ab 7.1 kann Stream Deck seine Laufzeiten nachladen; vor einem Offline-Einsatz muss die Laufzeit vorhanden sein. Eine IT-Sperre wird nicht umgangen.
- Benutzer darf eine entpackte Edge-Erweiterung und lokale `.streamDeckPlugin`-Pakete installieren. Port `29381` muss frei sein. Kein eingehender Netzwerk-Firewallport nötig.
- Keine Installation von Node.js, npm, Python, PowerShell-Modulen oder zusätzlichem Windows-Dienst erforderlich. Der Build ist bereits erledigt.
- Bestehende HeKI-/Grafana-Plugins bleiben installiert und behalten ihre Einstellungen, Lizenzen und Anmeldungen.

ZIP vollständig in einen stabilen lokalen Ordner entpacken, zum Beispiel `%LOCALAPPDATA%\HeKI-AutoProfile-Paket`. Nicht aus der ZIP-Vorschau starten. Beim Verschieben der Erweiterung kann sich deren ID ändern; dann neu koppeln.

## 1. Originale sichern und Profilkopien exportieren

1. Vorhandene Profile und eine vollständige Stream-Deck-Sicherung über die Oberfläche exportieren.
2. Das BBB-Profil in der Oberfläche **duplizieren**, Kopie etwa `HeKI Auto BBB XL` nennen. Falls keine Duplizierung angeboten wird, ein neues XL-Testprofil anlegen und Aktionen über die Oberfläche kopieren. Das Original bleibt unverändert.
3. Nur diese Kopie als `.streamDeckProfile` exportieren. Für den ersten Test genügt ein neues echtes XL-Profil mit gut sichtbarer Testaktion.
4. Optional HeKI, Grafana, Speakr und Standardprofil ebenso vorbereiten. Drittplugin-Aktionen und Aktionssettings bleiben im Export enthalten. Globale Drittplugin-Einstellungen sind nicht zwangsläufig Teil des Exports; HeKI ändert sie nicht.

Keine künstlich generierten Profile verwenden. Exportarchive werden als unveränderte Dateien behandelt; die interne Aktionsstruktur wird nicht interpretiert.

## 2. Persönliches Installationspaket in Edge erstellen

**Variante A – lokale Seite:** `Profile-Paket-erstellen.html` aus dem ZIP in Edge öffnen. Alle zugehörigen Dateien im Ordner belassen; Skripte und Kompressionsbibliothek liegen lokal bei. Die Seite benötigt keinen Server und stellt keine Netzwerkverbindungen her.

**Variante B – Erweiterungsseite:** Falls lokale HTML-Dateien gesperrt sind, zuerst die Edge-Erweiterung wie in Schritt 4 laden. In ihren Einstellungen „Eigene Exportprofile ohne Node.js in ein Installationspaket einbinden“ öffnen. Dieselbe Seite läuft dann innerhalb der Erweiterung. Keine Browserrichtlinien abschalten.

1. In der Zeile BBB die exportierte `.streamDeckProfile`-Datei auswählen.
2. Kennung `BBB` und Gerätetyp `Stream Deck XL · 32 Tasten` beibehalten. Anzeigename frei wählbar.
3. Weitere Exporte bei Bedarf unter `HeKI`, `Grafana`, `Speakr`, `Standard` auswählen; andere Zeilen leer lassen. Zusätzliche Kennungen über „Weiteres Profil“ ergänzen. Der Administrator wählt den zum Export passenden Gerätetyp; im Betrieb prüft das SDK den tatsächlichen Typ. Keine Typerkennung über das undokumentierte Archivinnere.
4. Beim ersten Paket Revision `1` verwenden. Für Änderungen eine höhere Revision als beim zuletzt installierten Paket wählen. Die Seite merkt sich nur diese Zahl, niemals Profilinhalte.
5. „Installationspaket erstellen“, dann „Paket herunterladen“. Ergebnis zum Beispiel: `HeKI-AutoProfile-1.0.1.1.streamDeckPlugin`.

Höchstens 32 Exporte, bis 50 MiB je Datei und 100 MiB insgesamt. Dateien bleiben lokal und werden bytegleich kopiert. Das persönliche Paket kann vertrauliche Settings enthalten: nicht öffentlich auf GitHub oder in Tickets hochladen.

## 3. Wie ein reguläres Plugin installieren

1. Die erzeugte `.streamDeckPlugin`-Datei **doppelklicken**. Die Dateizuordnung muss auf Stream Deck zeigen; bei Rückfrage Stream Deck als Anwendung wählen.
2. Den Installationsdialog bestätigen. Ein angebotenes Update betrifft ausschließlich die Plugin-ID `de.heki.autoprofile`.
3. Den Import der eigenen Profilkopien zulassen. Wird die Ersetzung eines Originalprofils angeboten, abbrechen und die exportierte Kopie prüfen.
4. In Stream Deck ein **neues** Einrichtungsprofil erstellen. Die Aktion „HeKI Auto Profile → Automatik / Kopplung“ darauf platzieren und auswählen.
5. Einen Kopplungscode im Einstellungsbereich erzeugen; er gilt zwei Minuten.

Keine CMD-Datei und kein manueller Kopiervorgang in den Pluginordner erforderlich. Das beiliegende `HeKI-AutoProfile-1.0.1-Basis.streamDeckPlugin` wurde mit der offiziellen CLI erstellt. Es dient zur Installation/Verbindungsprüfung **ohne persönliche Profile**. Für BBB das persönliche Paket verwenden; die Basis nicht anschließend darüberinstallieren.

Dies ist ein lokal verteiltes Plugin ohne Marketplace-Prüfung und Marketplace-DRM. Die öffentliche Plugin-API und die von Stream Deck verwaltete Laufzeit bleiben dieselben.

## 4. Edge-Erweiterung installieren und koppeln

1. `edge://extensions` öffnen, Entwicklermodus aktivieren.
2. „Entpackte Erweiterung laden“ und `edge-extension` aus dem ZIP wählen.
3. HeKI über das Erweiterungsmenü öffnen, bei Bedarf anheften.
4. „Mit Stream Deck koppeln“ aufklappen, Code einfügen, koppeln.
5. „Lokal verbunden“, SDK-Typ 2 und 8 × 4 müssen erscheinen. Fehlende Profile werden gemeldet.
6. Optional für einen reinen BBB-Test `config\BBB-Prototyp.json` importieren und speichern. Sonst gelten die vier Anfangsregeln.

Eine neue Kopplung ersetzt die vorherige. Nur ein Edge-Browserprofil gleichzeitig koppeln. InPrivate wird nicht unterstützt. Lokalen Netzwerkzugriff nur entsprechend der IT-Freigabe für diese Erweiterung zulassen; keine Unternehmensrichtlinien umgehen.

## 5. Sichtbaren Wechsel prüfen

Neutrales Startprofil im Host anzeigen, Edge fokussieren und BBB öffnen. Das echte BBB-Testprofil soll erscheinen. Zweiter BBB-Raum: kein zusätzlicher Wechsel. Danach HeKI, unbekannte Website, Outlook und Rückkehr zu Edge prüfen.

Die Anzeige meldet „Profilbefehl gesendet“, weil die SDK-Promise keine Hardwarebestätigung liefert. Alle weiteren Fälle und kritischen Grenzen stehen im Hardware-Abnahmeprotokoll.

Der Hintergrundendpunkt startet im Plugin-Einstiegspunkt. Ob der Host nach Neustart ohne sichtbare Aktion zuverlässig startet, ist auf der verwendeten Version zu prüfen. Alternative: **eigenes neues Startprofil** mit Steueraktion. Die Taste muss für automatische Wechsel nicht gedrückt werden. `Plugin-starten.cmd` sendet einen offiziellen passiven Deep-Link zur Diagnose, garantiert aber keinen universellen Autostart.
