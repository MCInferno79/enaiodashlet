# PageDeck: Daten und Berechtigungen

PageDeck arbeitet lokal zwischen Microsoft Edge und Stream Deck. Es gibt keine Telemetrie, Cloudkonten oder externen Server. Die aktive URL wird ausschließlich im Browser ausgewertet. Zum Plugin gehen Profilkennung, Fokus, Pause, Sequenznummer, Instanzkennung und Geräteauswahl; keine vollständigen URLs, Tabtitel oder Webseiteninhalte.

Die Edge-Erweiterung benötigt `tabs`, `storage`, `alarms`, `webNavigation` und die Hostberechtigung für `http://127.0.0.1/*`. Sie liest die URL des aktiven Tabs für die Zuordnung. Sie injiziert keine Skripte in Webseiten und fragt keine Webseitenberechtigungen für DOM-Aktionen an. Unternehmensrichtlinien können die Installation oder lokale Kommunikation beschränken.

Die HTTP-API bindet ausschließlich `127.0.0.1:29381`. Exakter Host, Remote-IP und Erweiterungs-Origin werden geprüft. Kopplungscodes bestehen aus 24 kryptografisch zufälligen Bytes, sind einmalig und zwei Minuten gültig. Ein Code führt zu einem neuen Token mit 32 zufälligen Bytes für genau eine Erweiterungs-Origin. Neue Kopplung ersetzt die vorherige. Höchstens fünf Kopplungsversuche pro Minute, begrenzte Anfragegrößen und Zeitlimits reduzieren Fehlbedienung und Missbrauch. Ereignisse benötigen eine aktuelle Dienstinstanz und steigende Sequenznummern.

Unter `%APPDATA%\PageDeck` liegen Token/Origin, Pausenzustand und feste Ereigniscodes. Der Windows-Schutz beruht auf den Rechten des Benutzerprofils; Unix-Modus 0600 ersetzt keine Windows-ACL. Beim Update werden alte Kopplung und Pause kopiert, wenn noch keine neuen Dateien vorhanden sind. Alte Dateien werden nicht gelöscht. `pairing.json` und Browserprofile gehören nicht in öffentliche Tickets oder Repositories.

Die lokale Profilvorbereitung liest nur ausdrücklich ausgewählte Dateien und stellt keine Netzwerkverbindung her. Profilarchive werden nicht geöffnet oder verändert. Ein `.streamDeckProfile` kann Einstellungen und sensible Daten anderer Plugins enthalten. Persönliche Exporte und persönliche Installer deshalb entsprechend aufbewahren. Der JSON-Regel-Export enthält eigene Domains, jedoch keine Kopplungsschlüssel.

Stream-Deck-Aktionen innerhalb Ihrer Profile haben ihre üblichen Berechtigungen und Wirkungen. PageDeck setzt keine eigenen Browserklicks, Texte oder Shellbefehle ab. Eine Marketplace-Prüfung ist nicht Bestandteil dieses lokal installierbaren Pakets.
