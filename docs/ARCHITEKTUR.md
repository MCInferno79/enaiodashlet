# Technische Machbarkeit und Architekturentscheidung

Stand der Prüfung: 14.10.2026. Implementiert mit `@elgato/streamdeck 3.0.2`; alle direkten Abhängigkeiten sind exakt versioniert, transitive Versionen im `package-lock.json` fixiert.

## Nachweisbare API-Grenzen

1. `streamDeck.profiles.switchToProfile(deviceId, profile?, page?)` kann nur Profile aktivieren, die im Pluginmanifest als mitgelieferte Profile registriert sind. Ein beliebiger Anzeigename eines vorhandenen Benutzerprofils genügt nicht.
2. Profile werden in der Stream-Deck-Oberfläche erstellt/exportiert und als `.streamDeckProfile` mit dem Plugin ausgeliefert. `Profiles[].Name` ist der relative Archivpfad ohne Dateiendung. Die Implementierung verwendet genau diesen Manifestwert.
3. `Readonly: false` erlaubt die Bearbeitung der importierten Plugin-Profilkopie. Das Original und die exportierte Paketdatei sind davon getrennt. Ein Update des Pakets ist keine automatische Sicherung einer danach bearbeiteten Profilkopie.
4. `DeviceType: 2` bezeichnet Stream Deck XL. `streamDeck.devices` liefert ID, Typ, Name, Größe und Verbindungsstatus. Nur tatsächlich verbundene Geräte werden gesteuert. Das Raster wird nicht auf 5 × 3 begrenzt.
5. Die Promise von `switchToProfile` bestätigt nur den **Versand**, nicht den Erfolg auf der Hardware. Es gibt hier keine erfundene API zum Abfragen des aktiven Benutzerprofils oder seiner Profilliste.
6. Ohne Profilargument fordert die dokumentierte API das vorherige Profil an. Eine verlässliche, beliebige historische Anker-ID lässt sich nicht abfragen.

## Komponenten

```text
Fokussierter Edge-Tab
        │ tabs / windows / webNavigation
        ▼
MV3-Service-Worker ───── deutsche Optionsseite
  URL nur im Arbeitsspeicher
  Host-/Pfadregeln → technische Profilkennung
        │ authentifiziertes JSON, keine besuchte URL
        │ POST http://127.0.0.1:29381/v1/...
        ▼
HeKI Stream-Deck-Plugin / Node.js 24
  Kopplung · Gerätetypfilter · serialisierte Umschaltung
        │ offizielles @elgato/streamdeck SDK
        │ switchToProfile(Geräte-ID, Manifest-Profilpfad)
        ▼
Stream-Deck-Anwendung → Stream Deck XL (8 × 4)
        │
        └─ importierte Kopien mit vorhandenen HeKI-/Grafana-Aktionen
```

HTTP im Plugin wurde gewählt, weil beide Komponenten lokal laufen und für Ereignisse kurze, zustandslose Anfragen genügen. Native Messaging würde einen weiteren registrierten Host, Windows-Registrierung und eine zusätzliche Prozess-/Installationskette erfordern. Der HTTP-Ansatz benötigt keinen separaten Dienst. Seine Grenze ist die vom Stream-Deck-Host verwaltete Plugin-Lebensdauer; dafür gibt es einen ausdrücklichen Abnahmetest und ein eigenes Einrichtungsprofil als unterstützte Startalternative.

## MV3, Fokus und Reihenfolge

Alle Eventlistener werden synchron auf oberster Ebene registriert. Tabs, URLs, Tab-Schließen/-Ersetzen/-Verschieben, Fensterfokus, Startup, SPA-History und Fragmentänderungen lösen eine neue Auswertung aus. `windows.getAll` mit `focused` verhindert, dass bloß das zuletzt verwendete Edge-Fenster bei Outlook-Fokus als aktiv gilt. Nur der aktive Tab dieses Fensters wird gelesen. Interne Browserseiten und Nicht-HTTP(S)-URLs ergeben keine Domainregel.

Der Worker hält keine dauerhafte Socketverbindung offen und benötigt keinen künstlichen Keepalive. Konfiguration, Token und Sequenz sind in `storage.local`; der Status mit höchstens dem aktuellen Host liegt in `storage.session`, nicht als Verlauf auf der Platte. Nach einem Worker-Neustart wird der aktuelle Zustand neu gelesen. Eine Revisionsnummer verwirft veraltete asynchrone Auswertungen vor dem Senden. Anfragen und Profilbefehle werden serialisiert.

Ein 30-Sekunden-Alarm prüft die Verfügbarkeit und erneuert die Fokus-Lease. Er ist keine Navigationserkennung und kein Untersekunden-Tab-Polling. Im Normalbetrieb erfolgen Befehle ereignisgetrieben; die angestrebte Sekunde ist auf der Hardware zu messen. Nach einem Pluginstart ohne Browserereignis kann die Wiederverbindung etwa 30 Sekunden oder bei suspendiertem Browser länger dauern. Nach Browserabsturz wird spätestens nach 90 Sekunden ausbleibender Meldungen plus bis zu 5 Sekunden Prüftakt eine Freigabe angefordert; nach Schlafzuständen gelten Host-/Browser-Verzögerungen.

## Rücksprung und Anwendungsprofile

Der Controller hält pro Gerät höchstens einen eigenen aktiven Profilwechsel. Beispiel:

```text
BBB → Freigabe → HeKI → Freigabe → BBB → Freigabe beim Edge-Verlassen
```

Eine neue Domain wird also nicht ungeprüft auf eine Kette vorheriger Domainprofile gestapelt. Gleiche Profilziele werden dedupliziert. Während Outlook fokussiert ist, werden keine neuen Domainprofile erzwungen und keine periodischen Profilwechsel gesendet.

**Dies ist keine Garantie, dass jede Hostversion nach einer Freigabe Smart Profiles sofort neu auswertet.** Die API hat keine eindeutige Ankerprofil-ID, keinen Freigabe-Acknowledgement und keine Information über zwischenzeitliche manuelle Profiländerungen. Pluginabsturz oder Hostneustart mitten in einem Override kann die historische Zuordnung verlieren. Der Status behauptet daher niemals „Profil erfolgreich aktiviert“ ohne beobachtbare Bestätigung.

Die implementierte unterstützte Alternative für einen **deterministischen Fallback innerhalb von Edge** ist ein explizit mitgeliefertes Standardprofil: unbekannte Website → festes Plugin-Standardprofil. Für die Übergabe an Outlook bleibt die dokumentierte Freigabe plus Hardwareabnahme erforderlich. Wenn die konkrete Hostversion diese Übergabe nicht korrekt ausführt, erfüllt diese SDK-only-Lösung den betreffenden Abnahmepunkt nicht; es gibt dafür keinen heimlichen Datenbank-, Makro- oder Stack-Unwind-Workaround. Dann bei der freigegebenen Hostversion bleiben, Elgato-Support einschalten oder die Automatik pausieren. Das ist eine echte Machbarkeitsgrenze.

Die Freigabe vor einem anderen Profil kann kurz das Ausgangsprofil anzeigen; ein absolut flackerfreier atomarer Profiltausch samt garantierter Wiederherstellung wird von der verfügbaren API nicht zugesichert. Diese visuelle Eigenschaft ist ebenfalls zu prüfen.

## Installation und Profilvorbereitung ab 1.0.1

Eine separate Node.js-Installation auf dem Dienstrechner entfällt vollständig. Node/npm und die offizielle CLI werden nur auf dem Buildrechner verwendet. `streamdeck pack` erzeugt den Basisinstaller `.streamDeckPlugin`. Endanwender installieren per Doppelklick über Stream Deck und nutzen dessen verwaltete Plugin-Laufzeit.

Die lokale Browserseite erhält ein eingebettetes, bytegleich aus dem offiziellen CLI-Paket abgeleitetes Dateiset. Auf dem Buildrechner wird allein der ZIP-Container normalisiert, weil die CLI ZIP64 auch bei kleinen Dateien erzeugt. Der Browser ergänzt Kopien echter `.streamDeckProfile`-Exporte, einen separaten Katalog und die dokumentierten `Profiles`-Manifesteinträge. Danach lädt er ein neues unverschlüsseltes `.streamDeckPlugin`-ZIP herunter. Er bearbeitet weder das installierte Plugin noch irgendeine laufende Profildatenbank.

Dieses Paketformat wurde gegen die öffentliche CLI-Ausgabe geprüft. Der mit exakt derselben Browserlogik erzeugte Paketinhalt besteht nach dem Entpacken die offizielle CLI-Validierung. Das ist ein Struktur-/Manifestnachweis, keine Behauptung einer realen Windows-Installation oder Marketplace-Signatur. Das persönliche Paket wird ausschließlich von der Stream-Deck-Anwendung importiert. Eine Veröffentlichung im Marketplace ist damit nicht verbunden.

Die Seite liegt sowohl als lokale HTML-Datei im ZIP als auch in der Edge-Erweiterung. Letzteres vermeidet eine Abhängigkeit von erlaubter `file://`-Navigation auf dem Zielrechner. Es gibt keinen zusätzlichen lokalen Vorbereitungsserver im Produkt. Der grafische Browsertest verwendet lediglich einen Testserver für die statischen Dateien, weil diese Cloud-Umgebung lokale Datei-URLs sperrt.

## Offizielle Quellen

- [Elgato: reguläre Pluginpakete und Distribution](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/)
- [Elgato: öffentliche CLI-Implementierung](https://github.com/elgatosf/streamdeck/tree/main/packages/cli)
- [Elgato: Profile erstellen, bündeln und wechseln](https://docs.elgato.com/streamdeck/sdk/guides/profiles/)
- [Elgato: Manifest und Profilattribute](https://docs.elgato.com/streamdeck/sdk/references/manifest/)
- [Elgato: SwitchToProfile-WebSocket-Vertrag](https://docs.elgato.com/streamdeck/sdk/references/websocket/plugin/#switchtoprofile)
- [Elgato: Geräte und Gerätetypen](https://docs.elgato.com/streamdeck/sdk/guides/devices/)
- [Elgato: Laufzeit und Plugin-Lebenszyklus](https://docs.elgato.com/streamdeck/sdk/introduction/plugin-environment/)
- [Elgato: aktive und passive Deep-Links](https://docs.elgato.com/streamdeck/sdk/guides/deep-linking/)
- [Microsoft: unterstützte Edge-Erweiterungs-APIs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support)
- [Microsoft: MV3-Erfahrungen und persistenter Zustand](https://devblogs.microsoft.com/engineering-at-microsoft/learnings-from-migrating-accessibility-insights-for-web-to-chromes-manifest-v3/)
- [Chromium: Service-Worker-Lebenszyklus](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chromium: tabs](https://developer.chrome.com/docs/extensions/reference/api/tabs), [windows](https://developer.chrome.com/docs/extensions/reference/api/windows), [webNavigation](https://developer.chrome.com/docs/extensions/reference/api/webNavigation)
- [Playwright: Erweiterungstests und Grenzen gebrandeter Browser](https://playwright.dev/docs/chrome-extensions)

Die Typdefinitionen und Implementierung der installierten offiziellen SDK-Version wurden zusätzlich lokal gegen die tatsächlich benutzten Funktionen geprüft.

## UI-Nachrichtenrouting ab 1.0.3

Die UI registriert sich mit dem vom Host übergebenen UUID. Für ausgehende `sendToPlugin`-Befehle wird dieser registrierte UI-UUID als `context` verwendet, entsprechend dem von Elgato empfohlenen sdpi-Client. Der Host ordnet die Nachricht der Aktion zu; das Plugin-SDK verarbeitet den Aktionskontext. UI-UUID und Aktionskontext werden im Test ausdrücklich verschieden gehalten. Antworten werden nur für diese beiden bekannten Kontexte und die eigene Aktion angenommen. Nach fünf Sekunden ohne passende Antwort endet die Button-Sperre; die Bereitschaft des lokalen Diensts wird ausschließlich aus Pluginmeldungen übernommen.
