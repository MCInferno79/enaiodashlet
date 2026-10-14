# Eigene PageDeck-Profile

Dieses Verzeichnis enthält im öffentlichen Basisplugin absichtlich keine persönlichen `.streamDeckProfile`-Archive. PageDeck kann nur echte im Pluginmanifest registrierte Exportprofile automatisch aktivieren.

Erstellen Sie die vollständigen Layouts direkt in Stream Deck und exportieren Sie Sicherungskopien. Mit `Profile-Paket-erstellen.html` lassen sich Ihre Exporte lokal zu einem persönlichen Installer zusammenstellen, ohne Node.js auf Ihrem PC. Alle weiterhin benötigten Profile gemeinsam auswählen; für Stream Deck XL Gerätetyp 2 verwenden. Anschließend den erzeugten Installer doppelklicken und Ihre Domains in Edge den eingebundenen Kennungen zuordnen.

Die Archive werden unverändert kopiert. Hotkeys, Texte, Ordner, Makros und Einstellungen anderer Plugins bleiben Bestandteil des Exports. Benötigte Drittplugins müssen auf dem Zielrechner installiert sein. Die offiziellen Profile bleiben bearbeitbar; nach Änderungen vor einem späteren Paketbau erneut exportieren.

Für einen Entwicklerbuild können eigene Exporte außerdem über `scripts/profiles.mjs` eingebunden werden. Persönliche Archive sind von Git ausgeschlossen und dürfen nicht versehentlich veröffentlicht werden. Beispiele und Tests verwenden nur klar gekennzeichnete künstliche Archive.
