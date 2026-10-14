# Sicherheit und Datenfluss

## Lokaler Betrieb

Die produktiven Komponenten enthalten keine Telemetrie, Analytics, externen Skripte, Cloud-APIs oder Updateabfragen. Der Edge-Service-Worker verbindet sich ausschließlich mit `http://127.0.0.1:29381`. Die Erweiterungs-CSP beschränkt `connect-src` auf diesen exakten Endpunkt. Stream Deck selbst und vorhandene Drittplugins haben ihre eigenen, unveränderten Netzwerkfunktionen; deren Verhalten wird von HeKI nicht kontrolliert.

Die Erweiterung erhält `tabs`, um die URL aktiver Tabs lesen zu können, `storage` für lokale Konfiguration und Kopplung, `alarms` für Wiederverbindung und Lease sowie `webNavigation` für History-/Fragmentnavigation in SPAs. Hostberechtigung nur für `http://127.0.0.1/*`; Chromium-Berechtigungsmuster beschränken Ports nicht, deshalb ergänzt die CSP die feste Portbindung. Keine Content-Scripts, keine Cookies-/History-/Debugger-/Native-Messaging-Berechtigung. `tabs` erlaubt technisch auch das Lesen von Titeln; die Implementierung verwendet keine Tabtitel.

## Kopplung

Der Benutzer erzeugt den 192-Bit-Zufallscode ausschließlich über den Property Inspector des eigenen Plugins. Er ist zwei Minuten gültig, wird nur im Arbeitsspeicher gehalten und nach erfolgreicher Verwendung ungültig. Fünf Versuche pro Minute begrenzen Fehlversuche; ein neuer im Inspector erzeugter Code setzt dieses Fenster neu auf.

Die Edge-Erweiterung sendet den Code an `/v1/pair`. Nur eine Origin der Form `chrome-extension://` mit gültiger Erweiterungs-ID darf koppeln. Nach erfolgreicher Kopplung speichert das Plugin genau diese Origin und einen neu erzeugten 256-Bit-Bearer-Token. Eine neue Kopplung ersetzt den alten Token; dieser wird bei anderen Anfragen nicht mehr akzeptiert. Das beantwortet zugleich den Fall „unbekannte Erweiterung am gleichen Port“: ohne den Inspector-Code kann sie sich nicht autorisieren.

## Endpunkt

- Bindung ausschließlich an IPv4-Loopback `127.0.0.1`, niemals `0.0.0.0` oder einen Rechnernamen.
- Prüfung der Remote-IP und des exakten HTTP-Host-Headers einschließlich Port; dies begrenzt DNS-Rebinding.
- Verpflichtender, genau geprüfter Origin-Header. Nach Kopplung wird nur die gebundene Erweiterung zugelassen. Gewöhnliche Webseiten erhalten keinen Zugriff; `Origin: null`, fehlende Origin und andere Erweiterungs-IDs werden abgelehnt.
- Exakte CORS-Freigabe statt `*`; authentifizierte POSTs, keine steuernden GETs. OPTIONS darf nur für die zulässige Origin vorprüfen.
- `Authorization: Bearer ...`, Vergleich in konstanter Zeit für gleich lange Werte. Keine Schlüssel in URL-Parametern.
- JSON-only, begrenzte Requestgröße von 8 KiB und Headerzahl, Timeouts. Ereignisse akzeptieren nur die definierten Felder und Werte.
- Pro Pluginstart eine zufällige Instanzkennung; persistente monoton steigende Sequenz verhindert verspätete/replizierte Zustände im laufenden Server. Profilkennung wird gegen den lokalen Katalog und Gerätetyp aufgelöst; fremde Benutzerprofilnamen werden nicht angenommen.
- `Cache-Control: no-store`, keine Weiterleitung und kein automatisch nachgeladener Code.

HTTP ohne TLS wird bewusst auf den lokalen Rechner begrenzt. Origin ist keine Prozessauthentifizierung gegenüber nativen Programmen: Ein lokaler Prozess kann Header nachbilden. Der zufällige Token bleibt daher erforderlich. Ein Programm unter demselben Windows-Benutzerkonto kann dessen Dateien oder Browserprofildaten lesen und ist durch diesen Ansatz nicht zuverlässig auszuschließen. Ebenso kann ein lokaler Prozess den Port belegen. Die Anwendung verspricht keinen Schutz gegen bereits kompromittierte Benutzerkonten oder Administratoren.

## Gespeicherte Daten

| Ort | Inhalt |
|---|---|
| Edge `storage.local` | Regeln, Pause, Geräteauswahl, Token, Sequenz; kein automatisch erstellter Besuchsverlauf |
| Edge `storage.session` | Aktueller Status, höchstens aktueller Host, Katalog-/Geräteinformationen; kein vollständiger URL-Pfad oder Query |
| `%APPDATA%\HeKI-AutoProfile\pairing.json` | Gebundene Origin und Token |
| `%APPDATA%\HeKI-AutoProfile\state.json` | Plugin-Pause |
| `service.log` / `.1` | Zeitstempel und feste Ereigniscodes; Rotation ab ca. 256 KiB je aktuelle Datei |
| Eigener Pluginordner | Unveränderte Exportarchive, Katalog und Binärbundle; mögliche sensible Drittplugin-Settings im Benutzerexport |

Installer setzt für den eigenen Datenordner ein Windows-ACL für aktuellen Benutzer und SYSTEM. `mode: 0600` allein ist unter Windows kein ausreichender ACL-Ersatz. Bei manueller Installation muss die IT diesen Zugriffsschutz selbst setzen. SDK-Logging wird auf Fehler begrenzt, damit Registrierung und Property-Inspector-Nachrichten nicht als Debug-/Trace-Dump aufgezeichnet werden. Eigene Logs enthalten keine Requestbodies, Domainnamen, Gerätnamen, Konferenzräume, URL-Parameter, Codes oder Token.

Die vollständige aktive URL wird nur kurzfristig im Browser zur Zuordnung verwendet. Übertragen werden Fokus, technische Zielkennung, Pause, Gerätefilter, Instanz und Sequenz. Ein JSON-Konfigurationsexport schließt Token aus. Trotzdem kann der Administrator selbst sensible Angaben in frei wählbare Regeln schreiben; das muss bei der Konfiguration vermieden werden.
