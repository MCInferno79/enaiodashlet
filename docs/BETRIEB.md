# Konfiguration, Betrieb, Update und Entfernung

## Neue Domains

Die HeKI-Schaltfläche in Edge öffnet die Optionsseite. „Neue Regel“ fügt eine Zeile hinzu. Anzeigename, Domain-/Pfadmuster, Plugin-Profil, Priorität und Aktivierung bearbeiten und anschließend speichern.

| Muster | Bedeutung |
|---|---|
| `bbb.herten.de` | Exakter Host, beliebiger Pfad, HTTP oder HTTPS |
| `*.herten.de` | Beliebig tiefe Subdomains, nicht der Basisname `herten.de` selbst |
| `heki.herten.de/dashboard` | Exakter Host; `/dashboard` und dessen Unterpfade, nicht `/dashboard-alt` |

Hostname wird über den URL-Parser normalisiert, einschließlich Groß-/Kleinschreibung und IDN/Punycode. Ein abschließender DNS-Punkt wird normalisiert. Ports werden bei der Hostzuordnung ignoriert; ein Port im Regelmuster ist nicht zulässig. Es gibt keine regulären Ausdrücke und keine Pfadwildcards. Für kodierte Pfade die tatsächliche URL-Pfadschreibweise verwenden. Query und Fragment beeinflussen die Regel nicht. Keine spezifischen Raum-IDs oder Geheimnisse in Regeln eintragen.

Höhere numerische Priorität gewinnt; bei gleichem Wert gilt die Reihenfolge der Tabellenzeilen. Regeln können deaktiviert oder gelöscht werden. Maximal 200 Regeln, Priorität von −10000 bis 10000. Ein zusätzlicher Profilname muss zuerst als echter Export in das Paket aufgenommen und das Plugin aktualisiert werden. Ein bloßes Umbenennen eines vorhandenen Benutzerprofils macht es nicht über die API schaltbar.

## Unbekannte Websites und Geräte

- **Profil freigeben:** den eigenen aktiven Profilwechsel einmal zurücknehmen. Keine angenommene beliebige historische Profilliste.
- **Benanntes Plugin-Standardprofil:** zum explizit eingebundenen Ziel wechseln. Das ist der deterministische Fallback für unbekannte Websites innerhalb von Edge.
- **Aktuelles verwaltetes Profil beibehalten:** innerhalb von Edge beim bisherigen HeKI-Ziel bleiben. Beim Verlassen von Edge wird trotzdem freigegeben.

In der Geräteauswahl gelten entweder alle passenden verbundenen Geräte oder ausgewählte IDs. Für jeden Zieltyp muss ein Export mit derselben Profilkennung und passendem `DeviceType` existieren. Ein XL-Export wird niemals als 15-Tasten-Profil auf ein anderes Gerät angewandt. Die Zuordnung ist typbasiert, nicht nach Gerätename.

## Pause und Bearbeitung

In Edge „Automatik pausieren“ wählen oder die HeKI-Steueraktion auf einer Profilkopie betätigen. Pause fordert die Freigabe des eigenen Profilwechsels an. Die Edge-Pause wird in Edge gespeichert; die Hardwareaktion setzt eine davon unabhängige lokale Plugin-Pause. Zeigt die Oberfläche „Pause am Stream Deck aufheben“, kann diese dort separat aufgehoben werden.

Bei Plugin-Pause wird beim Fortsetzen der zuletzt gemeldete Zustand verwendet, solange dessen Lease noch gültig ist. Bei Edge-Konfigurationsänderungen wird die aktive Domain unmittelbar neu ausgewertet. Für einen verbindlichen Neustart der Auswertung in Edge „Verbindung testen“ wählen bzw. zum gewünschten Tab zurückkehren.

**Vor Profilbearbeitung und manueller Profilwahl immer pausieren.** Das SDK meldet dem Plugin weder ein aktives Profil noch jede manuelle Profiländerung. Die Automatik kann sonst eine Bearbeitungsansicht verlassen oder beim späteren Freigeben auf ein unerwartetes vorheriges Profil treffen. Keine Änderungen an Originalprofilen sind für den Betrieb erforderlich.

## Start und Neustart

Stream Deck normal mit Windows starten lassen; die dafür vorgesehene Stream-Deck-Einstellung verwenden. Edge darf zuerst starten. Navigation oder der nächste Verfügbarkeitsalarm verbindet automatisch neu. Es gibt keinen HeKI-Autostartdienst und keinen Registry-Eintrag.

Nach einem Neustart der Stream-Deck-Software wird das Plugin vom Host neu gestartet. Vor einem geplanten Neustart pausieren und zum neutralen Startprofil zurückkehren, damit keine historische Override-Zuordnung verloren geht. Für den Start ohne sichtbare Aktion den entsprechenden Abnahmetest durchführen. Falls der Host das Plugin nur bei sichtbarer Aktion startet, ein neues eigenes Startprofil mit Steueraktion verwenden; vorhandene Originalprofile bleiben unverändert. `Plugin-starten.cmd` bietet zusätzlich den dokumentierten Deep-Link zur Diagnose.

Beim Trennen des Geräts wird dessen verwalteter Zustand verworfen. Bei erneutem Verbinden wird die gültige Fokusmeldung erneut angewandt. Fehlt ein Export für den Typ, erscheint eine Fehlermeldung statt eines beliebigen Profilwechsels.

## Sicherung

1. Automatik pausieren.
2. Alle inzwischen bearbeiteten Plugin-Profilkopien **über Stream Deck exportieren**. Das mitgelieferte Exportarchiv enthält nachträgliche Bearbeitungen nicht.
3. In Edge „Konfiguration exportieren“ wählen; JSON enthält Regeln und Geräteeinstellungen, aber keine Kopplungsschlüssel und keinen Browserverlauf.
4. Vollständige Stream-Deck-Sicherung über die Oberfläche erstellen, wenn auch Drittplugin-Einstellungen gesichert werden sollen.
5. Exportprofile und JSON an einem vom Administrator freigegebenen Speicherort aufbewahren. Profile können sensible Drittplugin-Aktionssettings enthalten.

## Update

1. Sicherung wie oben durchführen. Beide Pausen aufheben, falls dies für die Freigabe nötig ist, danach wieder pausiert lassen und im Host ein neutrales Profil auswählen. Stream Deck vollständig beenden.
2. Neues Paket separat entpacken. Die zuletzt exportierten Profilkopien mit dessen `Profile-einbinden.cmd` einbinden. Neue Versionskennungen wie `BBB_v2` vermeiden Mehrdeutigkeiten bei absichtlich geänderten Archivvorlagen; dann die Regelzuordnung ebenfalls ändern.
3. `Aktualisieren.cmd` ausführen. Es sichert nur den alten eigenen Pluginordner unter `%LOCALAPPDATA%\HeKI-AutoProfile-Backups\backup-...` und kopiert anschließend nur eigene Plugin-Dateien. Keine Profildatenbanken werden bearbeitet.
4. Stream Deck starten, nötige Importdialoge prüfen. Bearbeitete Profilkopien werden vom Host nicht zwingend mit neuen Paketvorlagen überschrieben; nicht auf ein automatisches Vorlagenupdate vertrauen.
5. Den neuen `edge-extension`-Inhalt an den bisherigen stabilen Installationsort kopieren; in `edge://extensions` „Neu laden“ wählen. Bei verändertem Erweiterungspfad bzw. ID neu koppeln.
6. Konfiguration bei Bedarf importieren und speichern. Pause aufheben und den kurzen BBB-/HeKI-/Outlook-Test wiederholen.

Der Profilassistent verweigert die direkte Bearbeitung eines Stream-Deck-Installationspfads unter `%APPDATA%`. Nur ein Vorbereitungspaket bearbeiten. `Aktualisieren.cmd` verändert ausschließlich den eigenen Pluginordner bei beendetem Stream Deck.

## Wiederherstellung

Stream Deck beenden. Den gesicherten eigenen Pluginordner an seinen bisherigen Ort zurückkopieren. Profile und vollständige Sicherungen ausschließlich über die Stream-Deck-Oberfläche importieren. In Edge die gesicherte Regeldatei importieren und speichern. Ein verlorener Kopplungsschlüssel wird durch eine neue Kopplung ersetzt. Keine Logs oder Schlüssel in Tickets hochladen.

## Vollständige Deinstallation

1. Automatik pausieren, ein normales Profil in Stream Deck auswählen, anschließend Stream Deck vollständig beenden.
2. `Deinstallieren.cmd` starten und die Entfernung mit J bestätigen. Es entfernt ausschließlich `de.heki.autoprofile.sdPlugin` und `%APPDATA%\HeKI-AutoProfile` mit lokalen Logs und Kopplung. Kein anderer Pluginordner wird berührt.
3. Unter `edge://extensions` die HeKI-Erweiterung entfernen. Dies entfernt deren lokale Regeln und Token aus diesem Browserprofil.
4. Nicht mehr benötigte HeKI-Profilkopien bei Bedarf in der Stream-Deck-Oberfläche löschen. Vorher exportieren, falls sie weiter benötigt werden. Originalprofile und Grafana-Plugin bleiben erhalten.
5. Das entpackte Paket und nicht mehr benötigte Sicherungen löschen. Es gibt keine Dienste, geplanten Tasks, Registry-Einträge oder Firewallregeln der Lösung zu entfernen.
