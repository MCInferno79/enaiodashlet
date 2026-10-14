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

## Update ohne Node.js

1. Automatik pausieren, bearbeitete Plugin-Profilkopien neu exportieren und Regelkonfiguration sichern. Im Host ein neutrales Startprofil auswählen.
2. Neues Release-ZIP separat entpacken. `Profile-Paket-erstellen.html` öffnen oder den entsprechenden Link in der aktualisierten Edge-Erweiterung verwenden.
3. **Alle weiter benötigten Exportprofile** auswählen. Bei Änderungen derselben Version eine höhere Paketrevision verwenden. Neue Profilkennungen wie `BBB_v2` sind sinnvoll, wenn bewusst eine neue Vorlage parallel zur alten eingeführt werden soll; dann die Domainregel entsprechend ändern.
4. Neues persönliches `.streamDeckPlugin`-Paket erstellen und herunterladen. Per Doppelklick installieren und die Update-/Importdialoge der Stream-Deck-Anwendung prüfen. Keine manuellen Eingriffe in laufende Profildatenbanken.
5. Edge-Erweiterungsdateien am bisherigen stabilen Ort durch die neuen Dateien ersetzen und unter `edge://extensions` neu laden. Bei geänderter Erweiterungs-ID neu koppeln.
6. Konfiguration bei Bedarf importieren/speichern, Pause aufheben und BBB-/HeKI-/Outlook-Kurztest wiederholen.

Die Basispaketdatei enthält keine persönlichen Profile und darf ein personalisiertes Paket nicht als Update ersetzen. Das persönliche Paket ist zugleich eine Sicherung der darin gebündelten Exportvorlagen; spätere Bearbeitungen müssen trotzdem neu exportiert werden. Der Browserassistent speichert keine Profile, daher nach Neuladen alle weiter benötigten Exporte erneut auswählen.

Bearbeitbare importierte Profilkopien werden vom Host nicht zwingend durch neue Archivvorlagen überschrieben. Nicht auf automatische Vorlagenupdates vertrauen. Über die offizielle Oberfläche gezielt eigene Kopien importieren bzw. neue Profilkennungen einsetzen. Originale niemals ersetzen.

## Wiederherstellung

Vorheriges persönliches `.streamDeckPlugin`-Paket aufbewahren. Bei Rückkehr zur Vorversion die von Stream Deck angebotenen Installations-/Entfernungsdialoge verwenden; je nach Versionsprüfung kann vorher die Entfernung des eigenen Plugins nötig sein. Profile und vollständige Stream-Deck-Sicherungen ausschließlich über die Oberfläche importieren. Regeldatei in Edge importieren und speichern. Verlorene Kopplung durch erneutes Koppeln ersetzen. Keine Schlüssel oder echten Exportarchive in öffentliche Tickets hochladen.

## Vollständige Deinstallation

1. Automatik pausieren und im Host ein normales Profil auswählen.
2. Das Plugin „HeKI Auto Profile“ über die Pluginverwaltung von Stream Deck entfernen. Die Bezeichnung des Menüs hängt von der Hostversion ab. Nur die eigene Plugin-ID `de.heki.autoprofile` entfernen; Grafana und andere Plugins bleiben installiert.
3. Unter `edge://extensions` die HeKI-Erweiterung entfernen. Damit werden deren Regeln und Token aus diesem Browserprofil entfernt.
4. Nicht benötigte HeKI-Profilkopien bei Bedarf über die Stream-Deck-Oberfläche löschen; vorher exportieren, falls sie weiter benötigt werden. Originalprofile erhalten.
5. Stream Deck beenden und im Explorer den eigenen Datenordner `%APPDATA%\HeKI-AutoProfile` mit Kopplung/Logs löschen, falls er von der Pluginentfernung nicht entfernt wurde. Anschließend nicht mehr benötigte persönliche Pakete und entpackte Releaseordner löschen.

Es gibt keine HeKI-Dienste, geplanten Tasks, Registry-Einträge, separat installierte Node-Laufzeit oder Firewallregeln zu entfernen. Die von Stream Deck verwaltete Plugin-Laufzeit gehört zur Stream-Deck-Software und wird nicht durch HeKI deinstalliert.
