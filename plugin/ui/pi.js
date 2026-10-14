(() => {
  const VERSION = '1.0.3';
  const ACTION = 'de.heki.autoprofile.control';
  const pair = document.querySelector('#pair');
  const code = document.querySelector('#code');
  const state = document.querySelector('#state');
  const diagnostic = document.querySelector('#diagnostic');
  let socket, parameters, retryTimer, connectTimer, codeTimer, pollTimer;
  let attempt = 0, serial = 0, backendReady = false, backendVersion = 'keine Antwort', hostVersion = 'unbekannt';
  const pending = new Map();
  const show = (id, message) => { state.textContent = `${id}: ${message}`; };
  function diagnostics() {
    diagnostic.textContent = `Oberfläche ${VERSION} · Plugin ${backendVersion} · Stream Deck ${hostVersion}\nSDK-Verbindung: ${['wird aufgebaut', 'offen', 'wird geschlossen', 'geschlossen'][socket?.readyState] || 'nicht gestartet'} · Lokaler Dienst: ${backendReady ? 'bereit' : 'nicht bereit'}`;
  }
  function clearCode() { clearTimeout(codeTimer); code.value = ''; }
  function clearPending() {
    for (const request of pending.values()) clearTimeout(request.timer);
    pending.clear();
  }
  function send(command) {
    if (socket?.readyState !== WebSocket.OPEN) {
      show('PI02', 'Keine Verbindung zu Stream Deck. „Verbindung erneut prüfen“ wählen.');
      return;
    }
    const requestId = `pi-${Date.now()}-${++serial}`;
    if (command === 'pair') { clearPending(); clearCode(); pair.disabled = true; show('PI01', 'Kopplungscode wird angefordert …'); }
    const timer = setTimeout(() => {
      pending.delete(requestId); pair.disabled = false; diagnostics();
      show('PI03', 'Keine Antwort auf die Anfrage. Der Button ist wieder frei: erneut versuchen oder „Verbindung erneut prüfen“ wählen.');
    }, 5000);
    pending.set(requestId, { command, timer });
    // The host routes UI commands by the registered UI UUID, then forwards the
    // action context to the plugin. This matches the recommended sdpi client.
    try { socket.send(JSON.stringify({ action: parameters.action, event: 'sendToPlugin', context: parameters.uuid, payload: { command, requestId } })); }
    catch { clearTimeout(timer); pending.delete(requestId); disconnected(socket); }
  }
  function disconnected(current) {
    if (socket !== current || current.hekiFailed) return;
    current.hekiFailed = true;
    clearTimeout(connectTimer); clearTimeout(pollTimer); clearPending(); clearCode();
    backendReady = false; pair.disabled = false; diagnostics();
    try { current.close(); } catch { /* already closed */ }
    if (attempt < 3) {
      const delay = 1000 * 2 ** attempt++;
      show('PI02', `Verbindung zu Stream Deck unterbrochen. Neuer Versuch ${attempt}/3 …`);
      retryTimer = setTimeout(connect, delay);
    } else show('PI02', 'Stream Deck ist nicht erreichbar. Stream Deck vollständig neu starten und diese Aktion erneut auswählen.');
  }
  function receive(event) {
    let message; try { message = JSON.parse(event.data); } catch { return; }
    if (message.event !== 'sendToPropertyInspector' || ![parameters.context, parameters.uuid].includes(message.context) || (message.action && message.action !== parameters.action)) return;
    const p = message.payload;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return;
    const request = pending.get(p.requestId);
    if (request) { clearTimeout(request.timer); pending.delete(p.requestId); }
    // A late pairing reply must not replace a newer request or expose an expired code.
    if (p.pairingCode && request?.command !== 'pair') return;
    if (typeof p.pluginVersion === 'string') backendVersion = p.pluginVersion;
    if (typeof p.streamDeckVersion === 'string') hostVersion = p.streamDeckVersion;
    if (typeof p.localServerReady === 'boolean') backendReady = p.localServerReady;
    diagnostics();
    const pairingPending = [...pending.values()].some(r => r.command === 'pair');
    pair.disabled = pairingPending;
    if (p.error) { show('PI04', String(p.error)); return; }
    if (p.pairingCode) {
      const remaining = Number(p.expires) - Date.now();
      if (!/^[a-f0-9]{48}$/.test(p.pairingCode) || !(remaining > 0 && remaining <= 125000)) {
        show('PI04', 'Das Plugin hat keinen gültigen Kopplungscode geliefert. Erneut anfordern.'); return;
      }
      clearCode(); code.value = p.pairingCode;
      show('PI10', 'Code erzeugt – innerhalb von zwei Minuten in Edge einfügen.');
      codeTimer = setTimeout(() => { clearCode(); show('PI11', 'Kopplungscode abgelaufen. Bei Bedarf einen neuen Code erzeugen.'); }, remaining);
      return;
    }
    if (pairingPending) return;
    if (!backendReady) {
      show('PI04', 'Das Plugin antwortet, aber der lokale Dienst ist noch nicht bereit. Bei dauerhafter Anzeige Port 29381 und service.log prüfen.');
      clearTimeout(pollTimer); pollTimer = setTimeout(() => send('status'), 2000);
      return;
    }
    clearTimeout(pollTimer);
    if (code.value) return;
    show('PI10', `${p.paused ? 'Automatik pausiert' : 'Bereit'}\nGeräte: ${(p.devices || []).map(d => `${d.name} (${d.size.columns}×${d.size.rows}, Typ ${d.type})`).join(', ') || 'keine'}\nEingebundene Profile: ${(p.profiles || []).map(profile => profile.label).join(', ') || 'keine'}`);
  }
  function connect() {
    clearTimeout(retryTimer); clearTimeout(connectTimer); clearTimeout(pollTimer); clearPending(); clearCode();
    if (socket) { const previous = socket; socket = undefined; try { previous.close(); } catch {} }
    backendReady = false; pair.disabled = false;
    show('PI01', 'Verbindung zu Stream Deck wird hergestellt …');
    try {
      const current = new WebSocket(`ws://127.0.0.1:${parameters.port}`); socket = current; diagnostics();
      connectTimer = setTimeout(() => disconnected(current), 5000);
      current.onopen = () => {
        if (socket !== current || current.hekiFailed) return;
        clearTimeout(connectTimer);
        try { current.send(JSON.stringify({ event: parameters.registerEvent, uuid: parameters.uuid })); }
        catch { disconnected(current); return; }
        show('PI01', 'Stream Deck verbunden. Warte auf HeKI-Plugin …'); diagnostics(); send('status');
      };
      current.onmessage = event => { if (socket === current && !current.hekiFailed) receive(event); };
      current.onerror = current.onclose = () => disconnected(current);
    } catch {
      show('PI02', 'Die Verbindung zu Stream Deck konnte nicht geöffnet werden. Aktion erneut auswählen.'); diagnostics();
    }
  }
  const hostTimer = setTimeout(() => show('PI00', 'Stream Deck hat die Einstellungsseite nicht verbunden. Diese Seite über die ausgewählte Aktion „Automatik / Kopplung“ in Stream Deck öffnen.'), 5000);
  window.connectElgatoStreamDeckSocket = (port, uuid, registerEvent, info, actionInfo) => {
    clearTimeout(hostTimer);
    try {
      const action = JSON.parse(actionInfo), host = JSON.parse(info);
      if (!/^\d{1,5}$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535 || typeof uuid !== 'string' || !uuid || typeof registerEvent !== 'string' || !registerEvent || typeof action.context !== 'string' || !action.context) throw new Error();
      if (action.action !== ACTION) throw new Error();
      parameters = { port, uuid, registerEvent, context: action.context, action: action.action };
      hostVersion = host.application?.version || 'unbekannt'; attempt = 0; connect();
    } catch { pair.disabled = false; show('PI00', 'Ungültige Startdaten von Stream Deck. Aktion erneut auswählen oder Stream Deck neu starten.'); diagnostics(); }
  };
  pair.onclick = () => {
    if (!parameters) { show('PI00', 'Bitte die Aktion „Automatik / Kopplung“ in Stream Deck auswählen.'); return; }
    if (socket?.readyState !== WebSocket.OPEN || socket.hekiFailed) { attempt = 0; connect(); return; }
    send('pair');
  };
  document.querySelector('#status').onclick = () => {
    if (!parameters) { show('PI00', 'Bitte die Aktion „Automatik / Kopplung“ in Stream Deck auswählen.'); return; }
    if (socket?.readyState === WebSocket.OPEN && !socket.hekiFailed) { clearPending(); show('PI01', 'Pluginstatus wird angefordert …'); send('status'); }
    else { attempt = 0; connect(); }
  };
  code.onclick = () => code.select();
  pair.disabled = false; diagnostics();
})();
