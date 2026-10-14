# Installation und BBB-Prototyp

## Voraussetzungen

- Windows 10/11, Microsoft Edge ab Chromium-Version 120, Stream Deck Software ab 7.1. Vorzugsweise die von der IT freigegebene aktuelle Version verwenden.
- Stream Deck XL, SDK-Typ `2`, 8 Spalten × 4 Zeilen. Andere Typen sind möglich, benötigen aber eigene Exportprofile für ihren Gerätetyp. Keine Beschränkung auf 15 Tasten.
- Stream Deck muss die Node.js-24-Laufzeit bereits bereitstellen. Ab 7.1 kann Elgato Laufzeiten nachladen. Die IT muss dies vor dem Offline-Einsatz vorbereiten; das HeKI-Paket lädt selbst nichts nach.
- Benutzer darf eine entpackte Edge-Erweiterung laden und einen eigenen Stream-Deck-Pluginordner installieren. Lokaler Port `29381` muss frei sein. Kein eingehender Firewall-Port erforderlich.
- Node.js ab 22 auf dem Vorbereitungsrechner für den CMD-Profilassistenten; für den späteren Betrieb ist keine zusätzliche systemweite Node-Installation nötig.
- Bestehende HeKI-/Grafana-Plugins bleiben installiert. Ihre Einstellungen, Lizenzen und Anmeldungen müssen weiter verfügbar sein.

Das ZIP vollständig in einen stabilen lokalen Ordner entpacken, beispielsweise `%LOCALAPPDATA%\HeKI-AutoProfile-Paket`. Nicht aus der ZIP-Vorschau und nicht von einer Netzwerkfreigabe starten. Beim Verschieben der entpackten Erweiterung kann sich ihre ID ändern; dann ist neu zu koppeln.

## 1. Sicherung und echte Profile vorbereiten

1. In Stream Deck die vorhandenen Profile über Einstellungen → Profile exportieren. Zusätzlich eine vollständige Stream-Deck-Sicherung über die dafür angebotene Oberfläche erstellen.
2. Das bestehende BBB-XL-Profil **in der Oberfläche duplizieren** und die Kopie beispielsweise `HeKI Auto BBB XL` nennen. Falls Ihre Version keine direkte Duplizierung anbietet, ein neues Testprofil anlegen und gewünschte Aktionen per Oberfläche kopieren. Das Original nicht überschreiben.
3. Nur diese Kopie exportieren, zum Beispiel nach `Dokumente\HeKI-Exporte\BBB-XL.streamDeckProfile`. Die Kopie hat eine eigene Profilidentität; ein Import soll keine vorhandenen Originale ersetzen. Erscheint ein Ersetzen-Dialog für ein Originalprofil, abbrechen.
4. Zum ersten BBB-Test genügt ein neues XL-Profil mit einer gut sichtbaren HeKI-Statusaktion. Das Profil über Stream Deck exportieren; es ist ein echtes Testprofil, kein vom Projekt erfundenes Archiv.
5. Für HeKI, Grafana, Speakr und optional ein Standardprofil entsprechend verfahren. Drittplugin-Aktionen und deren Aktionssettings bleiben in der Exportdatei enthalten. Globale Settings eines Drittplugins gehören nicht zwangsläufig zum Profilexport und werden von HeKI nicht kopiert oder verändert.
6. Stream Deck über das Symbol im Windows-Infobereich vollständig beenden. Nur das Fenster zu schließen reicht häufig nicht.
7. `Profile-einbinden.cmd` doppelklicken. Den vollständigen Dateipfad einfügen. Für BBB Kennung `BBB`, Anzeigename frei, SDK-Typ `2` verwenden. Für die anderen initialen Zuordnungen sind die Kennungen `HeKI`, `Grafana`, `Speakr` vorgesehen. Für einen Fallback kann `Standard` verwendet werden.
8. Der Assistent kopiert jedes Exportarchiv bytegleich und gibt seinen SHA-256-Hash aus. Er bearbeitet ausschließlich das entpackte Vorbereitungspaket, keine Stream-Deck-Profildatenbank. Leere Pfadeingabe beendet den Assistenten.

Profilschlüssel sind technische IDs aus Buchstaben, Zahlen, `_` und `-`. Der Anzeigename kann etwa `HeKI / Grafana` lauten. Für ein weiteres Gerät dieselbe Kennung mit dem passenden anderen Gerätetyp einbinden. Der Gerätetyp wird im Assistenten vom Administrator angegeben und zur Laufzeit mit dem SDK-Gerät verglichen; das undokumentierte Archivinnere wird nicht zur Typerkennung ausgewertet. Deshalb nur passende XL-Exporte als Typ 2 deklarieren.

## 2. Stream-Deck-Plugin installieren

1. `Installieren.cmd` ausführen. Es kopiert nur den eigenen Ordner nach `%APPDATA%\Elgato\StreamDeck\Plugins\de.heki.autoprofile.sdPlugin` und richtet den Zugriffsschutz für `%APPDATA%\HeKI-AutoProfile` ein.
2. Stream Deck starten. Falls Stream Deck die mitgelieferten Profile importieren möchte, den Import der zuvor erstellten Kopien zulassen. Keine Ersetzung eines Originalprofils bestätigen. `DontAutoSwitchWhenInstalled: true` verhindert einen gewünschten automatischen Sprung allein durch die Installation; die tatsächlichen Importdialoge können je nach Hostversion variieren.
3. In Stream Deck ein **neues** Einrichtungsprofil `HeKI Einrichtung XL` erstellen. Aus der Kategorie „HeKI Auto Profile“ die Aktion „Automatik / Kopplung“ auf eine Taste ziehen. Vorhandene Profile müssen dafür nicht verändert werden.
4. Die Aktion auswählen. Im Einstellungsbereich „Neuen Kopplungscode erzeugen“ betätigen. Den vollständigen Code kopieren. Er verfällt nach zwei Minuten.

Der Hintergrundserver startet im Plugin-Einstiegspunkt, unabhängig von `willAppear`. Für die Abnahme den Start auch ohne sichtbare HeKI-Aktion prüfen. Die Dokumentation des Hosts garantiert keinen universellen Autostartvertrag für jede Installation ohne genutzte Aktion. Ein eigenes Start-/Einrichtungsprofil mit sichtbarer Aktion ist die konservative Alternative. Das Plugin benötigt die Aktion während der laufenden Sitzung nicht auf jedem Zielprofil. Ein bekannter Host, der das Plugin nach dem Verschwinden aller Aktionen beendet, muss in der Hardwareabnahme erkannt werden; dann die Aktion in **neue Profilkopien** aufnehmen.

`Plugin-starten.cmd` sendet einen offiziellen passiven Deep-Link ohne Steuerdaten. Das kann zur Diagnose bzw. Aktivierung dienen; ein garantierter Autostart durch diesen Link wird nicht behauptet. Keinen zusätzlichen Windows-Dienst installieren.

## 3. Edge-Erweiterung installieren und koppeln

1. Edge öffnen und `edge://extensions` aufrufen.
2. „Entwicklermodus“ aktivieren.
3. „Entpackte Erweiterung laden“ wählen und den Ordner `edge-extension` aus dem Paket auswählen.
4. Über das Erweiterungsmenü HeKI öffnen, gegebenenfalls an die Symbolleiste anheften.
5. „Mit Stream Deck koppeln“ aufklappen, Code einfügen, „Koppeln“ betätigen.
6. „Lokal verbunden“ und das Gerät mit Typ 2 / 8 × 4 müssen erscheinen. Fehlende Profile werden als solche angezeigt.
7. Für einen reinen BBB-Prototyp optional `config\BBB-Prototyp.json` importieren und speichern. Ansonsten sind alle vier Anfangsregeln vorhanden; noch nicht eingebundene Ziele melden „Profil fehlt“.

Die Kopplung ist an die konkrete Erweiterungs-Origin gebunden. Eine neue erfolgreiche Kopplung ersetzt die vorherige. Nur ein Edge-Browserprofil gleichzeitig koppeln. InPrivate wird nicht unterstützt. Browsermeldungen über lokales Netzwerk nur für diese Erweiterung entsprechend der IT-Freigabe zulassen; keine Unternehmensrichtlinien abschalten.

## 4. Ersten sichtbaren Wechsel prüfen

1. Ein neutrales Benutzer-/Startprofil in Stream Deck anzeigen lassen.
2. Edge in den Vordergrund bringen und `https://bbb.herten.de` öffnen.
3. Das eingebundene BBB-Testprofil soll erscheinen. Die Edge-Statusanzeige meldet bewusst „Profilbefehl gesendet“, weil das SDK keine Bestätigung des tatsächlich angezeigten Profils liefert.
4. Einen zweiten BBB-Raum öffnen: kein weiterer Profilbefehl bei unverändertem Ziel.
5. Zu einer unbekannten Website wechseln: Freigabe des verwalteten Profils wird angefordert.
6. Outlook öffnen und wieder zu Edge zurückkehren. Die normale Anwendungssteuerung muss in Ihrer Hostversion weiter funktionieren.

Alle weiteren Fälle stehen im Abnahmeprotokoll. Erst nach bestandener Windows-/Hardwareabnahme regulär einsetzen.
