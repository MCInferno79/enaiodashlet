# Hardware-Abnahmeprotokoll

Version 1.0.3, Stand 14.10.2026. **Alle Hardwarezeilen sind offen.** Automatisierte Ersatzprüfungen sind im separaten Testbericht beschrieben und ersetzen diese Abnahme nicht.

Rechner/Benutzer: ____________________  Datum: __________

Windows/Edge/Stream-Deck-Version: ____________________

Geräte-ID, SDK-Typ und Raster laut Oberfläche: ____________________

Voraussetzungen: echte duplizierte XL-Profile eingebunden, Kopplung abgeschlossen, normale Outlook-Anwendungszuordnung im Host eingerichtet, Originalprofile gesichert. Für jeden Test Soll/Ist und gegebenenfalls Latenz eintragen. Keine echten Raum-URLs oder Tokens ins Protokoll übernehmen.

| Nr. | Aktion | Soll | Ist / bestanden |
|---|---|---|---|
| 1 | BBB-Raum A öffnen | BBB-Kopie erscheint, im Normalbetrieb möglichst < 1 s | offen |
| 2 | Anderen BBB-Raum öffnen | BBB bleibt, kein zusätzlicher Wechsel | offen |
| 3 | BBB → HeKI | HeKI-Kopie erscheint | offen |
| 4 | HeKI → BBB | BBB-Kopie erscheint | offen |
| 5 | Unbekannte Website / Modus Freigabe | Ausgangsprofil entsprechend Hostverhalten; keine Domainwechselkette | offen |
| 6 | Unbekannte Website / benanntes Standardprofil | Explizite Standardkopie erscheint | offen |
| 7 | BBB → HeKI → BBB → Outlook | Normales Outlook-Anwendungsprofil erscheint; keine dauerhafte Blockade | offen, kritisch |
| 8 | Outlook → Edge | Aktive Domain wird erneut ausgewertet | offen |
| 9 | BBB nur in Hintergrundtab öffnen | Vordergrundtab entscheidet unverändert | offen |
| 10 | Zwei Edge-Fenster mit unterschiedlichen Domains | Fokussiertes Fenster entscheidet | offen |
| 11 | Aktiven Tab schließen/ersetzen; Sitzung wiederherstellen | Neuer aktiver Tab wird ausgewertet | offen |
| 12 | SPA pushState/replaceState / Hash | Relevanter Host-/Pfadwechsel löst richtige Zuordnung aus | offen |
| 13 | Edge zuerst, Stream Deck später starten | Automatische Verbindung bei Ereignis bzw. etwa 30 s Alarm | offen |
| 14 | Stream Deck neu starten | Plugin und Verbindung kehren zurück; korrekte Profilzuordnung | offen |
| 15 | Edge komplett neu starten | Token/Regeln bleiben, aktive Domain wird erkannt | offen |
| 16 | Worker im Erweiterungsinspector stoppen, danach Tab aktivieren | Worker startet durch Ereignis neu | offen |
| 17 | Stream Deck XL trennen und wieder verbinden | Typ 2 / 8 × 4 erkannt, gültiges Ziel erneut angefordert | offen |
| 18 | Bestehende Grafana-Aktion in Original und Kopie verwenden | Pluginfunktion und Originalprofil unverändert | offen |
| 19 | Edge-Pause setzen, Domains wechseln | Kein Domainprofilwechsel; Fortsetzen wertet neu aus | offen |
| 20 | Hardware-Pause setzen und in Edge aufheben | Plugin-Pause korrekt getrennt dargestellt/aufgehoben | offen |
| 21 | Profilkopie bearbeiten während Pause | Bearbeitung bleibt stabil, Original unverändert | offen |
| 22 | Sehr schnelle Tabwechsel | Endzustand entspricht letztem aktiven Tab; kein dauerhafter Konflikt | offen |
| 23 | Plugin läuft, Steueraktion ist auf keinem sichtbaren Profil | HTTP bleibt verfügbar; Start nach Hostneustart separat prüfen | offen |
| 24 | Keine sichtbare Steueraktion beim Hoststart | Hintergrundstart nachweisen; andernfalls eigenes Startprofil mit Aktion verwenden | offen |
| 25 | Gewöhnliche Webseite / falsche Origin / falscher Token anfragen | Abweisung 403 bzw. 401; kein Profilbefehl | offen |
| 26 | Browser hart beenden | Freigabe nach Leaseablauf; tatsächlich sichtbares Profil prüfen | offen |
| 27 | Geplanter Plugin-/Hostneustart bei neutralem Ausgangsprofil | Keine falsche historische Rückkehr | offen |
| 28 | Offline ohne Internet | Alle HeKI-Funktionen verfügbar; bereits vorhandene Runtime vorausgesetzt | offen |
| 29 | Installation ohne systemweites Node, Update, Sicherung, Wiederherstellung, Deinstallation | Nur eigener Pluginordner betroffen, Originale erhalten | offen |
| 30 | Wechsel BBB ↔ HeKI beobachten | Visuelles Verhalten akzeptabel; Freigabe-/Wechselpaar kann Zwischenprofil zeigen | offen |

Zusätzlich die lokale Profilvorbereitung (Dateiauswahl → Download → Doppelklickinstallation) ohne Node/npm testen; die Exportarchive dürfen nicht verändert werden. Falls file:// gesperrt ist, den Link in der Erweiterung verwenden.

Kritische Fälle 7, 23/24 und 30 müssen auf der eingesetzten Hostversion bestanden bzw. mit der beschriebenen unterstützten Alternative abgedeckt sein. Ein automatisierter Test des gesendeten Befehls genügt hierfür nicht. Bei nicht erfüllbarer Outlook-Übergabe oder nicht akzeptablem Flackern keine Produktionsfreigabe; diese Grenzen kann die öffentliche API nicht beliebig aufheben.

Abnahme durch: ____________________  Freigabe/Restmängel: ____________________
