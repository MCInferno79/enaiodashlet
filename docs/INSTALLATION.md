# PageDeck installieren

Version 2.0.0, Stand 14.10.2026. Windows, Microsoft Edge und Stream Deck; das XL besitzt 32 Tasten. Stream Deck mindestens 7.1 mit verfügbarer Node.js-24-Plugin-Laufzeit. **Keine separate Node-Installation und kein zusätzlicher Windows-Dienst.**

1. Vollständiges ZIP in einen stabilen lokalen Ordner entpacken.
2. `PageDeck-2.0.0.streamDeckPlugin` doppelklicken. Stream Deck übernimmt die Installation. Das Paket benötigt für Webseiten-Tasten keine eigenen Exportprofile.
3. Unter `edge://extensions` die entpackte Erweiterung aus `edge-extension` laden. Unternehmensrichtlinien müssen dies erlauben.
4. In Stream Deck ein eigenes Profil anlegen oder ein vorhandenes verwenden. Unter „PageDeck“ die Aktion „Verbindung / Pause“ auf eine freie Taste ziehen und im Editor auswählen.
5. Im Einstellungsbereich „Neuen Kopplungscode erzeugen“ wählen. Die PageDeck-Erweiterung in Edge öffnen, „Stream Deck koppeln“ aufklappen und den Code innerhalb von zwei Minuten eingeben.
6. „PageDeck → Webseiten-Taste“ auf jede gewünschte Taste ziehen. Anfangs entspricht ihre Nummer der Position im Gerät; im Einstellungsbereich kann die Nummer 1–32 frei gewählt werden. Die Nummern können auf verschiedenen Webseiten unterschiedliche Funktionen erhalten.
7. In Edge „+ Webseite“ wählen. Eigene Domain oder Domain/Pfad angeben, Taste hinzufügen, Nummer und Beschriftung wählen, Schritte eintragen. „Website freigeben“ erteilt gezielten Zugriff für die eingetragene Domain; danach speichern.
8. Die konfigurierte Webseite in Edge in den Vordergrund bringen. Die Beschriftung am Deck sollte erscheinen. Taste drücken und Seitenreaktion prüfen.

Eine einfache Folge lautet: „Feld ausfüllen“, Selektor `input[name="q"]`, Text Ihrer Wahl; danach „Element klicken“, Selektor `button[type="submit"]`. Die Selektoren müssen zur konkreten Webseite passen. Sie lassen sich mit den Entwicklerwerkzeugen von Edge ermitteln. Ein grafischer Elementwähler ist noch nicht vorhanden.

## Update von 1.x

Die Produktbezeichnung lautet jetzt PageDeck. Die technische Plugin-ID `de.heki.autoprofile` wird für die Updatefähigkeit beibehalten. Deshalb kann das Paket das bisher installierte Plugin aktualisieren und vorhandene Steueraktionen weiterverwenden. Benutzerprofile bleiben bestehen.

Vor Änderungen eigene Profile wie gewohnt über Stream Deck sichern. Neues Plugin direkt installieren; für den dynamischen Webseiten-Modus **keine Profile exportieren oder Paketvorbereitung verwenden**. Edge-Dateien am bisherigen Erweiterungsort ersetzen, Erweiterung neu laden, Stream Deck vollständig beenden und neu starten. Oben im Einstellungsbereich muss „PageDeck 2.0.0“ erscheinen. Bei geänderter Erweiterungs-ID erneut koppeln.

Bisherige Profileinstellungen bleiben in Edge gespeichert, sind aber ab 2.0 nicht automatisch aktiv. Falls ausdrücklich gewünscht, kann „Optional: bisheriger Profilwechsel“ geöffnet und dort aktiviert werden. Dafür sind weiterhin eingebundene Exportprofile nötig. Die neue Webseiten-Funktion benötigt sie nicht.

## Optionaler Profilwechsel

Die SDK-Schnittstelle kann nur mit dem Plugin registrierte Profile aktivieren. Ausschließlich hierfür gibt es noch `Profile-Paket-erstellen.html`: eigene Exportkopien auswählen, neues persönliches Paket erzeugen, über Stream Deck installieren und den optionalen Profilwechsel in Edge aktivieren. Das ist kein Zugriff auf beliebige Benutzerprofile nach deren Anzeigenamen.
