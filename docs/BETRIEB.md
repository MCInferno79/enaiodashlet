# PageDeck bedienen und erweitern

## Automatischer Wechsel

Der aktive Tab im fokussierten Edge-Fenster bestimmt das vollständige Stream-Deck-Profil. Tabwechsel, Navigation, Fensterfokus und History-API-Navigation in Webanwendungen lösen eine Auswertung aus. Hintergrundtabs überschreiben das Profil nicht. Ein Tastendruck zum Wechseln ist nicht erforderlich.

In den Edge-Einstellungen legen Sie Website-Regeln an. Das Ziel ist immer eine Profilkennung aus dem installierten persönlichen Paket. Exakte Hosts sind unabhängig von Großschreibung; `*.example.org` erfasst Subdomains, jedoch nicht `example.org`. Ein Pfad wie `portal.example.org/dashboard` gilt für diesen Pfad und Unterpfade, nicht für `/dashboard-alt`. URL-Parameter und Fragmente dienen nicht zur Zuordnung. Bei mehreren Treffern gewinnt die höchste Priorität, bei Gleichstand die obere Regel.

## Unbekannte Seiten und Fokus

| Einstellung | Verhalten im aktiven Edge-Fenster |
|---|---|
| Profil freigeben | Den verwalteten Profilwechsel beenden |
| Benanntes Plugin-Standardprofil | Das gewählte eingebundene Profil aktivieren |
| Aktuelles verwaltetes Profil beibehalten | Das zuletzt von PageDeck aktivierte Profil behalten |

Beim Verlassen von Edge fordert PageDeck immer die Freigabe an. Vor dem Wechsel von einem verwalteten Profil zum nächsten wird das alte freigegeben, damit keine verschachtelte Profilhistorie entsteht. Die folgende Profilwahl und Smart Profiles anderer Anwendungen verwaltet Stream Deck selbst. Eine bestimmte Rückkehr etwa zu einem Outlook-Profil kann die SDK-Schnittstelle nicht garantieren.

„Alle passenden Geräte“ berücksichtigt Geräte mit einem eingebundenen Profil für ihren SDK-Gerätetyp. Einzelne Geräte lassen sich mit Strg auswählen. Ein XL benötigt Profile vom Typ 2; ein Export für ein anderes Modell wird nicht automatisch umgebaut.

## Pause und Bearbeitung

Die Schaltfläche in Edge pausiert die Browserautomatik. Ein Druck auf die physische Aktion „Automatik / Kopplung“ pausiert die Pluginseite zusätzlich. Beide Pausen werden getrennt gespeichert. Die Edge-Oberfläche kann eine Pluginpause aufheben. Während einer Pause wird die Profilfreigabe angefordert. Vor der Bearbeitung von Layouts pausieren, damit Navigation im Browser das bearbeitete Profil nicht wechselt.

## Eigene Layouts ergänzen

1. Das vollständige Profil in Stream Deck erstellen oder bearbeiten. Für Webseiteninteraktionen Ihre üblichen Hotkeys, Texte, Makros und vorhandenen Plugins verwenden. PageDeck wählt das Layout; die darin enthaltenen Aktionen führen die Eingaben aus.
2. Das aktuelle Profil als `.streamDeckProfile` exportieren. Nachträgliche Änderungen an einer importierten Profilkopie vor dem nächsten Paketbau erneut exportieren.
3. In `Profile-Paket-erstellen.html` alle weiterhin benötigten Exporte auswählen. Bestehende Kennungen beibehalten, neue Kennungen ergänzen und eine höhere Revision wählen.
4. Das neue persönliche Plugin herunterladen und per Doppelklick installieren. Stream Deck danach vollständig neu starten; in Edge „Verbindung testen“ wählen.
5. Neue Domainregeln dem neuen Profil zuordnen und speichern.

Änderungen an Domain, Pfad, Priorität und Gerätezuordnung für bereits eingebundene Profile brauchen kein neues Pluginpaket. Die exportierten Profile bleiben bearbeitbar. Eine erneute Installation kann neue Profilkopien anlegen; deshalb Exporte und Sicherungen aufbewahren.

## Sicherung und Entfernen

„Konfiguration exportieren“ sichert die Regeln und Geräteauswahl als JSON, ohne Kopplungstoken. Ein Import ersetzt die in der Oberfläche geladenen Regeln erst beim Speichern. Exportdateien können eigene Domains enthalten; persönliche Profilarchive enthalten möglicherweise Daten anderer Plugins.

Zur Entfernung PageDeck über die Pluginverwaltung von Stream Deck und die Erweiterung in Edge entfernen. Persönliche Profilkopien bei Bedarf über Stream Deck löschen. Nach Beenden von Stream Deck kann `%APPDATA%\PageDeck` mit Kopplung, Pause und Ereigniscodes gelöscht werden. Bei einem Update kopierte alte Einstellungen liegen noch im bisherigen Datenordner. Es gibt keinen zusätzlich installierten Systemdienst oder Autostarttask.
