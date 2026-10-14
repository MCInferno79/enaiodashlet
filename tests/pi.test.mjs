import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const script = await readFile('plugin/ui/pi.js', 'utf8');
function harness() {
  const nodes = Object.fromEntries(['pair','code','state','diagnostic','status'].map(id => [id, { disabled: id === 'pair', value: '', textContent: '', select() {} }]));
  let clock = 1000000, serial = 0; const timers = new Map(), connections = [];
  class FakeDate extends Date { static now() { return clock; } }
  class WebSocket {
    static OPEN = 1; readyState = 0; sent = [];
    constructor(url) { this.url = url; connections.push(this); }
    send(value) { assert.equal(this.readyState, 1); this.sent.push(JSON.parse(value)); }
    open() { this.readyState = 1; this.onopen(); }
    close() { this.readyState = 3; this.onclose?.(); }
    reply(payload, context = 'action-context') { this.onmessage({ data: JSON.stringify({ event: 'sendToPropertyInspector', context, action: 'de.heki.autoprofile.control', payload }) }); }
  }
  const window = {};
  vm.runInNewContext(script, { window, document: { querySelector: selector => nodes[selector.slice(1)] }, WebSocket, Date: FakeDate, setTimeout: (fn, delay) => { const id = ++serial; timers.set(id, { fn, at: clock + delay }); return id; }, clearTimeout: id => timers.delete(id) });
  const connect = () => window.connectElgatoStreamDeckSocket('12345', 'inspector-uuid', 'registerPropertyInspector', JSON.stringify({ application: { version: '7.3' } }), JSON.stringify({ action: 'de.heki.autoprofile.control', context: 'action-context' }));
  function advance(ms) { const end = clock + ms; let guard = 0; while (++guard < 100) { const next = [...timers].filter(([,t]) => t.at <= end).sort((a,b) => a[1].at-b[1].at)[0]; if (!next) break; clock = next[1].at; timers.delete(next[0]); next[1].fn(); } assert(guard < 100); clock = end; }
  function ready() { connect(); const socket = connections.at(-1); socket.open(); socket.reply({ requestId: socket.sent.at(-1).payload.requestId, localServerReady: true, pluginVersion: '2.1.0.0', devices: [], profiles: [] }); return socket; }
  return { nodes, connections, connect, ready, advance, now: () => clock };
}
test('Inspector verwendet die registrierte UI-UUID für Befehle und zeigt den Code an', () => {
  const h = harness(), s = h.ready(); assert.equal(s.sent[0].uuid, 'inspector-uuid'); assert.equal(s.sent[1].context, 'inspector-uuid');
  assert.equal(h.nodes.pair.disabled, false); h.nodes.pair.onclick(); const request = s.sent.at(-1);
  assert.equal(request.payload.command, 'pair'); assert.equal(h.nodes.pair.disabled, true);
  s.reply({ requestId: request.payload.requestId, pairingCode: 'a'.repeat(48), expires: h.now() + 120000, localServerReady: true });
  assert.equal(h.nodes.code.value, 'a'.repeat(48)); assert.match(h.nodes.state.textContent, /PI10/);
  h.advance(120000); assert.equal(h.nodes.code.value, ''); assert.match(h.nodes.state.textContent, /PI11/);
});
test('Bereit ohne Antwort auf Code-Anforderung endet mit eindeutiger Diagnose', () => {
  const h = harness(), s = h.ready(); h.nodes.pair.onclick();
  s.reply({ localServerReady: true, paused: false }); // An unrelated status must not complete the pairing request.
  h.advance(5000); assert.match(h.nodes.state.textContent, /PI03/); assert.equal(h.nodes.code.value, '');
  assert.equal(h.nodes.pair.disabled, false, 'Code-Button muss nach Timeout erneut bedienbar sein');
  s.reply({ requestId: s.sent.at(-1).payload.requestId, pairingCode: 'b'.repeat(48), expires: h.now()+120000 });
  assert.equal(h.nodes.code.value, ''); // Ignore late/expired requests.
});
test('Geschlossene SDK-Verbindung löscht Code und verbindet sich erneut', () => {
  const h = harness(), s = h.ready(); h.nodes.pair.onclick();
  s.reply({ requestId: s.sent.at(-1).payload.requestId, pairingCode: 'a'.repeat(48), expires: h.now()+120000 });
  s.close(); assert.equal(h.nodes.code.value, ''); assert.equal(h.nodes.pair.disabled, false); assert.match(h.nodes.state.textContent, /PI02/);
  h.advance(1000); assert.equal(h.connections.length, 2);
});
test('Fehlender Hostaufruf und nicht verfügbarer lokaler Dienst werden angezeigt', () => {
  const h = harness(); h.advance(5000); assert.match(h.nodes.state.textContent, /PI00/); assert.equal(h.nodes.pair.disabled, false);
  h.connect(); const s = h.connections.at(-1); s.open(); s.reply({ requestId: s.sent.at(-1).payload.requestId, localServerReady: false });
  assert.match(h.nodes.state.textContent, /PI04/); assert.equal(h.nodes.pair.disabled, false);
  s.reply({ localServerReady: true }); assert.equal(h.nodes.pair.disabled, false);
});

test('Erneuter Klick nach Timeout erhält auf derselben Verbindung einen Code', () => {
  const h = harness(), s = h.ready(); h.nodes.pair.onclick(); h.advance(5000);
  assert.equal(h.nodes.pair.disabled, false); h.nodes.pair.onclick();
  s.reply({ requestId: s.sent.at(-1).payload.requestId, pairingCode: 'c'.repeat(48), expires: h.now()+120000, localServerReady: true });
  assert.equal(h.nodes.code.value, 'c'.repeat(48)); assert.equal(h.nodes.pair.disabled, false);
});

test('Host-Antwort mit registrierter UI-Kennung wird akzeptiert; fremde Kennung abgelehnt', () => {
  const h = harness(), s = h.ready(); h.nodes.pair.onclick();
  const reply = { requestId: s.sent.at(-1).payload.requestId, pairingCode: 'd'.repeat(48), expires: h.now()+120000, localServerReady: true };
  s.reply(reply, 'foreign-context'); assert.equal(h.nodes.code.value, '');
  s.reply(reply, 'inspector-uuid'); assert.equal(h.nodes.code.value, 'd'.repeat(48));
});
test('Timeout verändert keine vom Plugin bestätigte Dienstbereitschaft', () => {
  const h = harness(); h.ready(); h.nodes.pair.onclick(); h.advance(5000);
  assert.match(h.nodes.diagnostic.textContent, /Lokaler Dienst: bereit/);
  assert.equal(h.nodes.pair.disabled, false);
});
