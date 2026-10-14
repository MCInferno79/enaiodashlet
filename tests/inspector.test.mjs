import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleFor } from './helpers.mjs';
const { inspectorMessages } = await moduleFor('plugin/inspector');
function harness(overrides = {}) {
  const sent = [], logs = []; let count = 0;
  const api = inspectorMessages({ isVisible: () => true, send: async p => { sent.push(p); }, status: () => ({ localServerReady: true, pluginVersion: '2.0.0.0' }), beginPairing: () => { count++; return { code: 'a'.repeat(48), expires: Date.now() + 120000 }; }, isServerReady: () => true, log: c => logs.push(c), ...overrides });
  return { api, sent, logs, count: () => count };
}
test('Kopplungsantwort enthält Code, Ablaufzeit und dieselbe Anfragekennung', async () => {
  const h = harness(); await h.api.receive('selected-action', { command: 'pair', requestId: 'request-1' });
  assert.equal(h.sent[0].pairingCode, 'a'.repeat(48)); assert.equal(h.sent[0].requestId, 'request-1');
  assert.equal(h.count(), 1); assert(!h.logs.join(' ').includes('a'.repeat(48)));
});
test('Frühe Kopplungsantwort wird beim Inspector-Erscheinen einmal nachgeliefert', async () => {
  let visible = false; const h = harness({ isVisible: () => visible });
  await h.api.receive('action', { command: 'pair', requestId: 'early' }); assert.equal(h.sent.length, 0);
  visible = true; await h.api.didAppear('action'); assert.equal(h.sent[0].requestId, 'early');
  assert.equal(h.sent[0].pairingCode, 'a'.repeat(48)); assert.equal(h.count(), 1);
  await h.api.didAppear('action'); assert.equal(h.sent[1].pairingCode, undefined);
});
test('Nicht gestarteter lokaler Dienst und interne Fehler liefern sichtbare Antworten', async () => {
  const h = harness({ isServerReady: () => false }); await h.api.receive('action', { command: 'pair', requestId: 'blocked' });
  assert.equal(h.count(), 0); assert.match(h.sent[0].error, /29381/); assert.equal(h.sent[0].requestId, 'blocked');
  const failed = harness({ beginPairing: () => { throw new Error('sensitive implementation detail'); } });
  await failed.api.receive('action', { command: 'pair', requestId: 'failed' }); assert.match(failed.sent[0].error, /nicht verarbeiten/);
  assert(!JSON.stringify(failed.sent).includes('sensitive')); assert(failed.logs.includes('PI_COMMAND_FAILED'));
});
