# PageDeck 2.0.0: Testbericht

Prüfdatum 14.10.2026. Buildumgebung: Linux, Node.js 24.19.0, TypeScript 5.9.3, Elgato-SDK 3.0.2, CLI 1.10.2, Chromium. Auf dem Anwenderrechner wird keine separate Node-Installation benötigt.

## Ausgeführte Prüfungen

- `npm run check` und `npm run build`: strikte Typprüfung, SDK-Plugin, Edge-Oberflächen, Installer und optionale Profilvorbereitung.
- `npm test`: **35 Tests**. Bestehende Matching-/Controller-/HTTP-/Kopplungs-/Paketprüfungen plus neutraler Start, neues Webseitenmodell, Domain-/Pfadzuordnung, Aktionsvalidierung, gepinnte Origin, WebSocket-Authentifizierung, Ausführung und veraltete/ungültige Belegungen.
- `npm run validate` und `npm run validate:personalized`: offizielle Elgato-Validierung des direkten Installers sowie des weiterhin optionalen persönlichen Profilpakets.
- `npm run test:web`: gebautes Plugin mit echtem SDK → SDK-Tastendruck → echtes authentifiziertes Loopback-HTTP/WebSocket → ausgeführter Erweiterungsworker → Chromium mit realem DOM. Geprüft: Feld füllen, Text an Auswahlposition einfügen, Seiten-Tastenkürzel, Klick, Scrollen, Tabnavigation, geänderte Tastennummer, Zurückweisung ungültiger Zahlenwerte ohne Datenverlust, abgelaufene Anfragen vor verzögerter DOM-Ausführung, Fokusverlust, fehlende Freigabe, Pause und keine Texte/Selektoren/URLs im Tastenprotokoll. Stream-Deck-Host und Chrome-Erweiterungs-APIs sind simuliert; die DOM-Ausführung findet im echten Browser statt.
- `npm run test:workspaces-ui`: neutraler Start, Webseite anlegen, gezielte Origins-Freigabe, Taste, zwei Schritte und Speichern in der tatsächlich gerenderten neuen Oberfläche. Chrome-APIs simuliert.
- `npm run test:inspector`: echtes UI-JavaScript und SDK-Plugin, Codeanzeige, erfolgreiches HTTP-Pairing, frühe Inspector-Anfrage, Timeout und anschließender erfolgreicher zweiter Klick. Hostrouting simuliert.
- `npm run test:ui`: weiterhin vorhandene optionale Profilseite mit simuliertem chrome.*.
- `npm run test:packager`: optionale lokale Profilvorbereitung; frei gewählte Kennung, Dateiübernahme, Download und unveränderte Exportbytes. Statische Testbereitstellung über HTTP.
- `npm run test:reference -- work/sdpi-reference`: Nachrichtenvergleich mit separat ausgeführtem sdpi-StreamDeckClient auf Commit `bfd17677540da403e28ecc442110df77be4306ca`; Registrierung und Anfragen verwenden dieselbe UI-Kennung. Referenzcheckout wird nicht mitgeliefert.

## Praktische Grenzen

Das Laden einer echten entpackten Erweiterung sowie direkter file://-Zugriff sind in dieser Entwicklungsumgebung durch die Browseradministration gesperrt. Diese Regeln werden nicht umgangen. Die verfügbaren Tests verwenden deshalb echte Webseiten mit simulierten Erweiterungs-APIs bzw. den ausgeführten Workerquellcode. Ein bestandener Test bestätigt keine reale Windows-/Edge-/XL-Installation.

Offen sind die Hardwareabnahme, Installation/Update über die Windows-Anwendung, Live-Beschriftung am realen Deck, Freigabedialoge im tatsächlichen Edge, Zuverlässigkeit auf den Zielwebseiten, besondere Editoren/Frames, Unternehmensrichtlinien und Neustarts auf dem Zielrechner. Seiten-Tastenkürzel sind synthetische DOM-Ereignisse und keine Windows-/Browser-Hotkeys.

Die im neuen Modus benötigten Webseiten und Aktionen werden vollständig vom Anwender angelegt. Testseiten und alte Fachanwendungsregeln sind ausschließlich Fixtures und werden nicht als aktive Produktvorgaben ausgeliefert.
