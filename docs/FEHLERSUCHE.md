# PageDeck: Fehlersuche

| Anzeige oder Problem | Prüfung |
|---|---|
| Keine PageDeck-Aktion | Persönlichen Installer doppelklicken; Stream Deck ab 7.1 mit verfügbarer verwalteter Plugin-Laufzeit verwenden und vollständig neu starten. |
| Leere Profilauswahl | Das Basisplugin hat keine Exporte. Mit `Profile-Paket-erstellen.html` echte eigene Exporte einbinden und das erzeugte persönliche Plugin installieren. |
| Lokale HTML-Seite gesperrt | Dieselbe Profilvorbereitung über den Link in den Einstellungen der geladenen Edge-Erweiterung öffnen. Unternehmensrichtlinien beachten. |
| PI00 | Den Einstellungsbereich der ausgewählten Aktion „Automatik / Kopplung“ in Stream Deck öffnen. |
| PI01 bleibt stehen | Versionszeile prüfen; „Verbindung erneut prüfen“ wählen und gegebenenfalls Stream Deck vollständig neu starten. |
| PI02 | Verbindung der Einstellungsseite zu Stream Deck unterbrochen; nach Wiederholungsversuchen neu starten und Aktion erneut auswählen. |
| PI03 / kein Code | Plugin hat innerhalb von fünf Sekunden nicht geantwortet. Der Button wird wieder frei. Erneut anfordern, „Verbindung erneut prüfen“ wählen und Versionszeile/Protokoll prüfen. |
| PI04 / Dienst nicht bereit | Plugin antwortet, aber Port 29381 ist noch nicht verfügbar. Doppelte Instanz, Portbelegung und lokale Sicherheitssoftware prüfen. |
| PI10 / Code sichtbar | Code anklicken, Strg+C, innerhalb von zwei Minuten in Edge koppeln. |
| PI11 | Code abgelaufen; neuen Code erzeugen. |
| Kopplung fehlt oder erneuert | Nur ein Edge-Browserprofil koppeln; bei geänderter Erweiterungs-ID erneut koppeln. |
| Lokaler Dienst nicht erreichbar | Stream Deck starten. „Verbindung testen“ in Edge wählen oder nächsten Wiederverbindungsalarm abwarten. |
| Profil für dieses Gerät fehlt | Geräteauswahl, Profilkennung und SDK-Gerätetyp prüfen; XL benötigt Typ 2. Export in neues persönliches Paket aufnehmen. |
| Befehl gesendet, Layout unverändert | Die API bestätigt nur Versand. Prüfen, ob die Profilkopien beim Installieren importiert wurden und ob der Export zum Gerät passt. In Stream Deck manuell öffnen. |
| Kein Wechsel auf Website | Speichern, aktive Regel, Domain/Pfad, Priorität und beide Pausen prüfen. Nur der aktive Tab des fokussierten Edge-Fensters zählt. |
| Noch Webseiten-Tasten aus 2.0 | Persönliches Paket 2.1 installieren, Edge-Dateien ersetzen und Erweiterung neu laden, Stream Deck vollständig neu starten. Neue native Profile selbst einrichten. |
| Hotkey oder Drittplugin-Aktion funktioniert nicht | Das importierte Profil manuell prüfen, benötigtes Drittplugin installieren und Fokusanforderungen des Hotkeys beachten. |
| Rückkehr zu anderem Anwendungsprofil abweichend | PageDeck sendet beim Verlassen von Edge eine Freigabe. Anschließende Profilwahl und Smart Profiles steuert Stream Deck. |

Der physische PageDeck-Knopf pausiert; ein Kopplungscode wird im Einstellungsbereich erzeugt. Für automatische Profilwechsel brauchen Sie keine eigene Umschalttaste.

Das Protokoll liegt unter `%APPDATA%\PageDeck\service.log`. Beispiele: `START`, `PI_PAIR_REQUEST`, `PI_REPLY_SENT`, `PI_REPLY_DEFERRED`, `PI_COMMAND_FAILED`, `PROFILE_COMMAND_SENT`, `PROFILE_RELEASE_SENT`, `LOCAL_PORT_UNAVAILABLE`, `MIGRATION_SKIPPED`. Bei `MIGRATION_SKIPPED` können alte Einstellungen nicht kopiert werden; erneut koppeln und Pause prüfen. Keine Tokens oder persönlichen Profilarchive öffentlich hochladen. Für Support genügen zunächst PageDeck-/Stream-Deck-/Edge-Version, Gerät, PI-Code und Versionszeile.
