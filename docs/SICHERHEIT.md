# PageDeck: Daten und Berechtigungen

PageDeck arbeitet lokal zwischen Microsoft Edge und Stream Deck. Es gibt keine Telemetrie, Cloudkonten oder externen Server. Vom Browser zum Deck gehen die eigenen Tastenbeschriftungen, Tastennummern, opaque Kontextkennungen und Statusdaten. Konfigurierte Texte, Selektoren und aktive Webseiten-URLs werden nicht an das Stream-Deck-Plugin übertragen oder protokolliert.

Die Erweiterung liest aktive Tabs für die Webseitenzuordnung. DOM-Zugriff verlangt zusätzlich eine optionale Freigabe für die von Ihnen eingetragene Domain. „Website freigeben“ fragt nur die passenden HTTP-/HTTPS-Origins an. Die Erweiterung kann diese Freigabe nicht beim Tastendruck still erteilen. Unternehmensrichtlinien bleiben maßgeblich.

Aktionen werden nur nach einem physischen SDK-Tastendruck angefordert und im fokussierten passenden Tab ausgeführt. Vor jedem DOM-Schritt werden Dokumentfokus und URL geprüft. Konfigurationen erlauben nur die fest implementierten Schritte; kein beliebiges JavaScript, keine Shell, keine Native-Messaging-Installation. Passwort-, Datei- und versteckte Felder werden nicht befüllt. Normale Textwerte werden lokal in den Erweiterungseinstellungen gespeichert und sind im Konfigurationsexport enthalten.

Die Loopback-API bindet ausschließlich `127.0.0.1:29381`. Exakter Host, Origin und Remote-IP werden geprüft. Der Kopplungscode ist einmalig und zwei Minuten gültig; daraus entsteht ein Token für genau eine Erweiterungs-Origin. Der WebSocket verlangt diesen Token in der ersten Nachricht und begrenzt Größe, Authentifizierungszeit und offene Anfragen. Bei neuer Kopplung verliert die alte Tastenverbindung ihre Berechtigung.

Im lokalen Datenordner liegen Token/Origin, Pausenzustand und feste Ereigniscodes. Windows-Schutz erfolgt über die Rechte des Benutzerprofils; der Unix-Modus 0600 ersetzt keine Windows-ACL. `pairing.json`, Browserprofile und ungeprüfte persönliche Exporte nicht in öffentliche Tickets oder Repositories hochladen.

Ein ausgeführter Klick kann einen fachlichen Vorgang auslösen. Schrittfolgen stoppen beim ersten Fehler; bereits erfolgte Eingaben/Klicks lassen sich durch PageDeck nicht allgemein zurücknehmen. Testen Sie neue Folgen an geeigneten Beispielen. Browser-/Windows-Hotkeys und Anwendungen, die echte Hardwareereignisse verlangen, bleiben normale Stream-Deck-Funktionen.
