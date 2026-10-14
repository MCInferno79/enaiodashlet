# PageDeck 2.1: Installation ohne separate Node.js-Installation

## Voraussetzungen

Windows 10 oder neuer, Stream Deck ab 7.1 mit der verwalteten Node.js-24-Plugin-Laufzeit und Edge ab Chromium 120. Für den Benutzerrechner sind weder npm noch eine eigene Node-Installation oder PowerShell-Buildbefehle nötig. Unternehmensrichtlinien müssen die entpackte Edge-Erweiterung und den lokalen Zugriff erlauben. Das Zielgerät ist Stream Deck XL mit 32 Tasten, SDK-Typ 2.

## Persönliches Plugin vorbereiten

1. ZIP vollständig in einen dauerhaften lokalen Ordner entpacken. `START-HIER.html` enthält die Anleitung.
2. Die gewünschten vollständigen Layouts in Stream Deck erstellen. Dort richten Sie Hotkeys, Texteingaben, Makros, Ordner und Aktionen Ihrer installierten Plugins ein. Originalprofile zur Sicherung duplizieren und die Kopien als `.streamDeckProfile` exportieren.
3. `Profile-Paket-erstellen.html` in Edge öffnen. Je Export eine eindeutige Profilkennung, einen Anzeigenamen, den richtigen Gerätetyp und die Datei wählen. Die Kennung darf Buchstaben, Zahlen, Bindestrich und Unterstrich enthalten, z. B. `Meeting` oder `Portal`. Sie ist später das Ziel der Website-Regel.
4. Für das erste Paket Revision 1 verwenden, „Installationspaket erstellen“ wählen und das Paket herunterladen. Die Exportarchive bleiben bytegleich und werden nicht hochgeladen.
5. Das erzeugte persönliche `PageDeck-2.1.0.1.streamDeckPlugin` doppelklicken und die Installation einschließlich eigener Profilkopien bestätigen. Erforderliche Drittplugins separat über Stream Deck installieren.

Alle weiter benötigten Exporte gehören gemeinsam in dasselbe Paket. Ein neues Paket mit nur einem Profil enthält auch nur dieses Profil. Maximal 32 Exporte, 50 MiB je Datei und 100 MiB insgesamt. Gerätetyp und Export müssen zueinander passen; die lokale Vorbereitung untersucht das innere Profilformat absichtlich nicht.

Das beigefügte `PageDeck-2.1.0-Basis.streamDeckPlugin` dient nur der Kopplungsdiagnose, solange noch keine Exporte vorliegen. Es enthält keine fertigen Layouts. Für den normalen Betrieb installieren Sie das persönliche Paket. Installieren Sie das leere Basisplugin nicht nach einem persönlichen Paket.

## Edge einrichten und koppeln

1. `edge://extensions` öffnen, Entwicklermodus aktivieren und „Entpackte Erweiterung laden“ wählen. Den Ordner `edge-extension` auswählen. Sperren durch Unternehmensrichtlinien müssen von Ihrer IT freigegeben werden.
2. In einem neutralen Einrichtungsprofil die Aktion **PageDeck → Automatik / Kopplung** platzieren. Im Stream-Deck-Editor auswählen; der Einstellungsbereich muss Oberfläche 2.1.0, Plugin 2.1.0.x und „Lokaler Dienst: bereit“ anzeigen.
3. Dort „Neuen Kopplungscode erzeugen“ wählen. Code anklicken und mit Strg+C kopieren. Innerhalb von zwei Minuten in den PageDeck-Einstellungen in Edge unter „Mit Stream Deck koppeln“ einfügen und koppeln.
4. „+ Neue Regel“ wählen, die eigene Domain eintragen, das eingebundene Profil auswählen und speichern. Beispiel: `meet.example.org` → `Meeting`.
5. Die Webseite in Edge öffnen und in den Vordergrund bringen. Das vollständige Layout soll ohne Tastendruck wechseln. Eine zweite Regel und Webseite prüfen.

Der Knopf auf dem physischen Deck pausiert oder aktiviert die Automatik. Er löst keinen manuellen Seitenwechsel aus. Die Kopplungsaktion wird für den laufenden Wechsel nicht in jedem Layout benötigt. Ein Einrichtungsprofil zum erneuten Koppeln behalten.

Wenn lokale HTML-Dateien nicht ausgeführt werden dürfen: Zuerst die Edge-Erweiterung laden und über ihre Einstellungen die enthaltene Profilvorbereitung öffnen. Diese enthält dieselbe lokale Paketfunktion.

## Update von früheren Versionen

Vor Änderungen eigene Profile und die Edge-Regeln exportieren. Mit der neuen Profilvorbereitung ein Paket mit allen gewünschten Exporten erstellen und installieren. Edge-Dateien im bisher geladenen Ordner ersetzen, die Erweiterung neu laden und Stream Deck vollständig beenden und neu starten.

Die technische Plugin-ID `de.heki.autoprofile` und die Steueraktions-ID bleiben ausschließlich für bestehende Installationen stabil. Die Anzeige lautet PageDeck. Bestehende Kopplung und Pause werden in den neuen Datenordner `%APPDATA%\PageDeck` kopiert, sofern dort noch keine Einstellungen liegen. Die bisherigen Dateien bleiben erhalten.

Die 1.x-Profilregeln bleiben nutzbar. Die zusätzliche Abschaltung des Profilwechsels in 2.0 wird nicht mehr ausgewertet. Die 2.0-Webseiten-Tasten werden entfernt; gespeicherte Tastenfolgen sind keine nativen Profile und werden nicht automatisch umgewandelt. Bei geänderter Erweiterungs-ID erneut koppeln. Eine aktive Pause bleibt erhalten und muss bei Bedarf aufgehoben werden.
