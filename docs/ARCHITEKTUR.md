# PageDeck: Architektur und Erweiterung

PageDeck trennt Webseitenkonfiguration und Seitenaktionen vom Stream-Deck-Profil. Die frei platzierten Plugin-Tasten besitzen nur eine Nummer. Die Edge-Erweiterung ordnet diese Nummer anhand der aktiven Webseite einer Beschriftung und Schrittfolge zu.

```text
Fokussierter Edge-Tab
  → URL-Regel und Webseitenkonfiguration in Edge
  → lokale WebSocket-Verbindung: opaque Kontextkennung + Tastennummern/Labels
  → offizielles Elgato-SDK: Beschriftung der sichtbaren PageDeck-Tasten

Physischer Tastendruck
  → offizielles SDK → lokale Verbindung: Kontextkennung + Tastennummer
  → erneute Fokus-, URL-, Konfigurations- und Berechtigungsprüfung in Edge
  → chrome.scripting im Hauptframe: Klick / Texteingabe / Seiten-Tastenkürzel
```

## Module

| Datei | Aufgabe |
|---|---|
| `src/shared/workspaces.ts` | Modell, Validierung, Webseitenzuordnung, Freigabe-Origins |
| `src/extension/workspaces-ui.ts` | Deutsche Webseiten-/Tastenoberfläche |
| `src/extension/deck-link.ts` | Authentifizierte Tastenverbindung, Binding, Fokusprüfung und Ausführung |
| `src/extension/page-actions.ts` | Ausführbare DOM-Schritte ohne freie Codeauswertung |
| `src/plugin/web-channel.ts` | Loopback-WebSocket, Authentifizierung, Layout und begrenzte Anfragen |
| `src/plugin/index.ts` | SDK-Aktionen „Verbindung / Pause“ und „Webseiten-Taste“ |
| `src/plugin/inspector.ts` / `plugin/ui/` | Kopplung, Status, Tastennummer |

Die neue Konfiguration liegt separat unter `chrome.storage.local.workspaces`. Die alten Profilregeln bleiben für die optionale Zusatzfunktion unter `config`. `profileSwitchingEnabled` ist zunächst false; die alte Automatik muss ausdrücklich aktiviert werden. Die technische Plugin-ID und der Datenordner bleiben für das Update von 1.x erhalten. Produktname, Oberfläche, Installationsdateien und Voreinstellungen sind PageDeck.

## Protokoll

`127.0.0.1:29381`: bestehende authentifizierte POST-API für Kopplung/Status/Pause. Zusätzlich `/v1/deck` als WebSocket. Upgrade verlangt exakten Host, Loopback-IP und gepinnte Erweiterungs-Origin. Die erste Nachricht muss innerhalb von vier Sekunden den vorhandenen Token authentifizieren. Der Token steht weder in einer URL noch in Logs. Neue Kopplung schließt die bisherige Tastenverbindung.

Layout: `{type:"layout",context,buttons:[{slot,label}]}`. Tastendruck: `{type:"execute",context,slot,requestId,expires}`. Antwort: `{type:"result",requestId,ok}`. URLs, Selektoren und eingetragene Texte bleiben im Browser. Maximal 16 KiB pro Frame, 32 Tasten, acht offene Anfragen; Anfragefrist fünf Sekunden; vor jedem Browser-Schritt wird die mitgegebene Frist von 4,5 Sekunden geprüft. Nach 60 Sekunden ohne Lebenszeichen wird die Verbindung zurückgesetzt. Heartbeat alle 20 Sekunden; die Erweiterung beantwortet ihn und aktualisiert die Belegung.

Bei neuer Seite, neuem Tab oder geänderter Konfiguration entsteht eine neue opaque Kontextkennung. Vor Ausführung werden Fokus, Tab, URL und vollständige gewählte Webseitenkonfiguration erneut geprüft. DOM-Schritte prüfen außerdem URL und Dokumentfokus direkt vor jedem Schritt. Bei Fehler endet die Folge ohne Wiederholung; es gibt kein automatisches Wiederholen von Klicks oder Eingaben.

## Eine neue Aktionsart ergänzen

Den Typ in `Step`, seine Validierung, die Beschriftung/Editorfelder in `workspaces-ui.ts` und die Ausführung in `page-actions.ts` ergänzen. Die Ausführungsfunktion muss ohne Modulabhängigkeiten serialisierbar bleiben. Danach Modellprüfungen und einen realen DOM-Test hinzufügen. Für Browserfunktionen wie Tabnavigation gehört die Ausführung in `deck-link.ts`. Kein `eval`, keine frei importierten Skripte und keine dynamischen Shellkommandos.

## Echte Stream-Deck-Profile

Die offizielle SDK-Schnittstelle kann nur im Manifest registrierte Exportprofile aktivieren. Benutzerprofile lassen sich weder auflisten noch direkt aktivieren. Die bisherigen Controller-/Paketvorbereitungsmodule bleiben für diesen getrennten optionalen Weg erhalten. Der neue Webseiten-Modus verwendet sie nicht zum Wechseln Ihres Deck-Profils.

## UI-Routing

Die Property-Inspector-UI registriert sich mit dem vom Host gelieferten UUID. Ausgehende Befehle verwenden diese UI-Kennung entsprechend dem sdpi-Referenzclient; Antworten werden für UI- und Aktionskontext akzeptiert. Der Vergleich mit dem ausgeführten Referenzclient bleibt als Entwicklerprüfung verfügbar. Tasten-Settings werden über die offizielle Settings-API gespeichert; bestehende andere Aktionssettings bleiben erhalten.
