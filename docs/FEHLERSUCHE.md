# PageDeck: Fehlersuche

| Beobachtung | Prüfung |
|---|---|
| Keine PageDeck-Aktionen | Installer per Doppelklick installieren; Stream Deck ab 7.1 mit verfügbarer Node.js-24-Plugin-Laufzeit; vollständig neu starten. |
| Tasten zeigen nur „PageDeck / Nummer“ | Webseite in Edge fokussieren. Passende Domain/Pfadregel und Aktivierung prüfen, speichern, Pause prüfen. |
| Beschriftung ändert sich nicht | Einen selbst vergebenen festen Tastentitel im Stream-Deck-Editor entfernen; das SDK überschreibt ihn nicht. |
| Falsche Tastenfunktion | Tastennummer im Einstellungsbereich mit der Nummer in Edge vergleichen; Domain/Pfad und Priorität prüfen. |
| Warnsymbol nach Tastendruck | PageDeck in Edge öffnen: letzter Fehler. Fehlende Website-Freigabe, Elementselektor, Fokus und Pause prüfen. |
| Website-Zugriff fehlt | Eigene Domain eintragen und „Website freigeben“ wählen. Falls die Organisation dies blockiert, deren Freigabe einholen; keine Richtlinien umgehen. |
| Element nicht gefunden | Selektor in Edge prüfen. Element muss im Hauptframe liegen; bei SPAs erst nach dessen Darstellung drücken. |
| Text wird nicht übernommen | Standardfeld, Schreibschutz, Feldtyp und Format prüfen. Besondere Editoren können eine eigene Integration benötigen. |
| Hotkey ohne Wirkung | Seiten-Tastenkürzel sind DOM-Ereignisse. Windows-/Browser-Hotkeys direkt als Stream-Deck-Hotkey-Aktion einrichten. |
| Kein Code / PI03 | UI-Version prüfen. Ab 2.0 wird nach fünf Sekunden der Button wieder frei. Erneut versuchen oder Verbindung erneut prüfen; Status- und Versionszeile melden. |
| PI00 | Inspector wurde nicht mit gültigen Hostdaten verbunden. Aktion im Stream-Deck-Editor auswählen. |
| PI02 | SDK-Verbindung geschlossen; Wiederverbindung oder Stream Deck vollständig neu starten. |
| PI04 | Angezeigten Dienstfehler prüfen. Bei Portkonflikt 29381 keine zweite Plugininstanz parallel starten. |
| PI10 / PI11 | Bereit bzw. Code angezeigt / Code abgelaufen. Bei Bedarf neu erzeugen. |
| Erweiterung gesperrt | `edge://policy` und Freigaben der Organisation prüfen. |
| Verbindung nach Update fehlt | Edge-Dateien am bisherigen Erweiterungsort aktualisieren, Erweiterung neu laden, Stream Deck neu starten. Bei geänderter Erweiterungs-ID neu koppeln. |
| Keine echten Profile in der Liste | Elgato erlaubt keinen Zugriff auf beliebige Benutzerprofile. Für dynamische Webseiten-Tasten ist keine Profilauswahl nötig. Optionaler Profilwechsel benötigt weiterhin eingebundene Exporte. |

Die Statusmeldung steht im Inspector direkt über dem Kopplungsbutton. Bei „Webseiten-Taste“ zusätzlich die Tastennummer einstellen. Ein Druck auf „Verbindung / Pause“ am Gerät pausiert; ein Code wird im Einstellungsbereich erzeugt.

Lokale Ereigniscodes liegen aus Update-Kompatibilität unter `%APPDATA%\HeKI-AutoProfile\service.log`. Beispiele: `START`, `PI_PAIR_REQUEST`, `PI_REPLY_SENT`, `PI_REPLY_DEFERRED`, `PI_COMMAND_FAILED`, `WEB_ACTION_OK`, `WEB_ACTION_FAILED`, `WEB_TITLE_FAILED`, `LOCAL_PORT_UNAVAILABLE`. Keine URLs, Selektoren, Texte oder Tokens werden geloggt. Für Support zunächst PageDeck-/Stream-Deck-/Edge-Version, Gerät und Fehlercode nennen.
