# PageDeck 2.1.0: Testbericht

Stand 14.10.2026. Die Prüfungen beziehen sich auf das gebaute PageDeck-Paket. Die Hardware-Abnahme auf Windows und dem echten XL-Gerät ist offen.

## Automatisierte Prüfung

- `npm run verify`: TypeScript-Prüfung, vollständiger Build, 31 Kernprüfungen und offizielle Elgato-CLI-Validierung von Basisplugin und personalisiertem Testpaket.
- Regelauswertung: neutraler Erststart, exakte Hosts, Subdomain-Grenzen, IDN, Pfadgrenzen, Prioritäten, deaktivierte Regeln und Eingabevalidierung.
- Controller: Freigabe vor Profilwechsel, doppelte Ereignisse, fehlende Exporte, Geräteauswahl, Pause, Fokusverlust und überholte Aufträge.
- Lokale HTTP-API: Origin/Host/Token, einmalige Kopplung, Rate-Limit, monotone Sequenzen, Dienstinstanz und Ablehnung unerwarteter Ereignisfelder.
- MV3-Ereignisquellcode mit simulierten Chrome-APIs: aktives fokussiertes Fenster, SPA, Wiederverbindung, Neustart und vertrauliche URL-Bestandteile bleiben im Browser. Alte 2.0-Abschaltung verhindert den wiederhergestellten Profilwechsel nicht.
- Tatsächlich gebautes Plugin mit offiziellem Elgato-SDK und echtem HTTP: Browserereignis führt über einen simulierten Stream-Deck-WebSocket-Host zu `switchToProfile`; zwischen verschiedenen Profilen steht eine Freigabe. Kein `keyDown` wird als Auslöser gesendet.
- Tatsächlicher Pluginstart mit temporärem APPDATA: alte Kopplung und Pause werden zu PageDeck kopiert, neue Einstellungen beim nächsten Start erhalten und alte Dateien unverändert gelassen.
- Persönliche Paketfunktion: Exportarchive bleiben bytegleich, Kennungen/Gerätetypen werden geprüft, Manifestprofile registriert und CLI-ZIP64 verlustfrei für den Browser normalisiert. Die Testarchive sind ausdrücklich keine echten Hardwareprofile.
- Kopplungsoberfläche: SDK-Registrierung, UI-Kontextrouting, frühe Antworten, Request-IDs, Timeouts, erneuter Versuch und Freigabe des Buttons bei fehlender Antwort.

## Chromium-Prüfungen

`npm run test:ui` prüft die tatsächlich gerenderte Regeloberfläche: neutraler Start, Regel anlegen/löschen, Domain einem Profil zuordnen, speichern und pausieren. Chrome-APIs sind dabei simuliert. `docs/Optionsvorschau.png` stammt aus dieser Testvorschau.

`npm run test:packager` wählt ein ausdrücklich künstliches Exportarchiv aus, erzeugt den persönlichen Installer, lädt ihn herunter und prüft die bytegleiche Kopie und XL-Manifestregistrierung. Es werden keine externen HTTP(S)-Anfragen gestellt. Die statischen Dateien werden durch einen lokalen Testserver bereitgestellt.

`npm run test:inspector` verbindet die reale gerenderte Kopplungsoberfläche mit dem tatsächlich gebauten Plugin über einen simulierten Stream-Deck-Host. Erzeugter Code, HTTP-Kopplung, erneuter Versuch und Versionsanzeige werden geprüft.

`npm run test:reference -- work/sdpi-reference` vergleicht die ausgehende SDK-UI-Registrierung und Anfragestruktur mit dem ausgeführten empfohlenen sdpi-Referenzclient. Der Referenzstand ist im Prüfskript festgehalten.

## Grenzen

In dieser Umgebung sind die Installation echter Erweiterungen und Tests lokaler `file://`-Seiten administrativ gesperrt. Diese Sperren werden nicht umgangen. `test:browser` ist deshalb hier kein bestandener Nachweis. Gewöhnliche HTTP-Seiten, der kompilierte MV3-Ereignisquellcode und die dokumentierten Hostsimulationen werden separat geprüft.

Es liegt kein echter persönlicher `.streamDeckProfile`-Export des Benutzers vor. Im öffentlichen Basisinstaller sind daher keine Layouts erfunden oder als echte Profile ausgegeben. Die tatsächliche Doppelklick-Installation, der Profilimport und das sichtbare automatische Layout auf Windows/Edge/XL bleiben gemäß `ABNAHME.md` vor Ort zu prüfen. Der SDK-Test bestätigt den Befehlsversand, nicht die sichtbare Hardwareanzeige.
