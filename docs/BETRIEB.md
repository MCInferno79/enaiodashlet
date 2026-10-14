# PageDeck bedienen und erweitern

PageDeck arbeitet innerhalb Ihres selbst gestalteten Stream-Deck-Profils. „Webseiten-Taste“ besitzt eine Nummer von 1–32. In Edge definieren Sie für jede Webseite die Beschriftung und Funktion dieser Nummer. Andere Stream-Deck-Aktionen bleiben frei belegbar.

## Webseite hinzufügen

„+ Webseite“ wählen, Anzeigename und Domain eintragen, bei Bedarf Priorität setzen. Beispiele:

| Muster | Bedeutung |
|---|---|
| `portal.example.org` | Exakter Host |
| `*.example.org` | Subdomains, nicht `example.org` selbst |
| `portal.example.org/aufgaben` | Pfad und Unterpfade; nicht `/aufgaben-alt` |

„+ Taste“ fügt eine freie Nummer hinzu. Wählen Sie dieselbe Nummer wie im Einstellungsbereich der Deck-Taste. Beschriftung und 1–10 Schritte bearbeiten, die Webseite freigeben und speichern. Neue Webseiten und Änderungen benötigen kein neues Pluginpaket. Pro Webseite sind höchstens 32 Tasten möglich. Größere Priorität gewinnt; Gleichstände entscheiden sich nach Reihenfolge in der Konfiguration.

## Aktionsschritte

- **Element klicken:** CSS-Selektor wie `#speichern`. Das Element muss vorhanden, sichtbar und aktiv sein.
- **Feld ausfüllen:** CSS-Selektor und Text; ersetzt den Inhalt eines normalen Eingabefelds oder Textbereichs. DOM-Eingabe-/Änderungsereignisse werden ausgelöst. Passwort-, Datei- und versteckte Felder werden nicht befüllt.
- **Text einfügen:** Einfügen an der Auswahlposition. Ohne Selektor wird das fokussierte Standard-Eingabefeld verwendet.
- **Seiten-Tastenkürzel:** zum Beispiel `Control+Shift+k`, `Enter`, `ArrowDown`. Dies sind synthetische Tastaturereignisse innerhalb der Webseite. Die Reaktion hängt von der Webanwendung ab. Windows-/Browser-Hotkeys als normale Stream-Deck-Aktionen daneben einrichten.
- **Scrollen:** Pixelzahl, negativ für nach oben.
- **Seite öffnen:** vollständige HTTP(S)-Adresse ohne Zugangsdaten; letzter Schritt. Öffnet im bisherigen Tab.

Schritte laufen der Reihe nach. Wenn ein Element fehlt oder ein Schritt fehlschlägt, endet die Folge; bereits ausgeführte Schritte werden nicht rückgängig gemacht. Verzögerungs-/Warteschritte, beliebiges JavaScript, fremde Frames und ein visueller Elementwähler gehören noch nicht zu dieser Version. Nach Navigation oder geänderter Konfiguration wird eine veraltete Anfrage verworfen.

## Fokus, Rückmeldung und Pause

Nur der aktive Tab des fokussierten Edge-Fensters darf Aktionen erhalten. Bei unbekannter Webseite, Pause oder Fokusverlust werden die Webseiten-Tasten neutral beschriftet. Ein fehlgeschlagener Tastendruck zeigt am Deck ein Warnsymbol; die Edge-Einstellungen nennen den zuletzt bekannten Fehler. Ein grünes Häkchen bedeutet, dass die konfigurierten Schritte ausgeführt bzw. die Ereignisse übergeben wurden; es bestätigt nicht den Geschäftsvorgang auf einem Webserver.

Die Aktion „Verbindung / Pause“ pausiert das gesamte Plugin. Die Edge-Oberfläche besitzt zusätzlich eine lokale Pause. „Pause am Deck aufheben“ hebt die Plugin-Pause auf. Bei Verbindungsabbruch werden Tastenbelegungen entfernt; erneute Browserereignisse oder der Verfügbarkeitsalarm verbinden neu. Ein WebSocket-Heartbeat hält die laufende Tastenverbindung aktiv.

## Sichern und aktualisieren

„Webseiten exportieren“ sichert Webseiten, Tasten und Schrittfolgen als JSON. Der Export enthält eingetragene Texte, aber keinen Kopplungsschlüssel. Nach Import prüfen und speichern; Website-Freigaben bei Bedarf erneut erteilen. Ihr normales Stream-Deck-Profil sichern Sie weiterhin über Stream Deck.

Für ein Programmupdate das neue `.streamDeckPlugin` installieren und die Erweiterungsdateien am bisherigen Ort aktualisieren. Keine Profilpakete für Webseiten-Aktionen bauen. Regeln und Tasten werden in Edge gespeichert. Bei einer neuen Erweiterungs-ID erneut koppeln und Konfiguration importieren. Vor größeren Änderungen die Automatik pausieren.

## Deinstallation

PageDeck in Stream Deck über die Pluginverwaltung entfernen und die Edge-Erweiterung entfernen. Nicht benötigte PageDeck-Tasten können im eigenen Profil gelöscht werden. Andere Aktionen und Benutzerprofile bleiben bestehen. Der bisherige lokale Datenordner `%APPDATA%\HeKI-AutoProfile` enthält aus Kompatibilitätsgründen weiterhin Kopplung, Pause und Ereigniscodes. Bei vollständiger Entfernung nach Beenden von Stream Deck bei Bedarf löschen. Es gibt keinen zusätzlichen Dienst, Autostarttask oder separat installierten Node-Prozess zu entfernen.
