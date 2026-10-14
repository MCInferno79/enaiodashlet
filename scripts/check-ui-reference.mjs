import { build } from 'esbuild';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const referenceRoot = process.argv[2];
if (!referenceRoot) throw new Error('Pfad zu einer sdpi-components-Referenzkopie als Argument erforderlich. Siehe docs/TESTBERICHT.md.');
assert.equal(execFileSync('git', ['-C', referenceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), 'bfd17677540da403e28ecc442110df77be4306ca');
const compiled = await build({ entryPoints: [path.join(referenceRoot, 'src/stream-deck/stream-deck-client.ts')], bundle: true, write: false, format: 'iife', globalName: 'Reference', platform: 'browser', target: 'chrome120' });
function environment() {
  const connections = [], timers = new Map(); let next = 0;
  class WebSocket {
    static OPEN = 1; readyState = 0; sent = [];
    constructor() { connections.push(this); }
    send(value) { this.sent.push(JSON.parse(value)); }
    open() { this.readyState = 1; this.onopen(); }
    close() { this.readyState = 3; this.onclose?.(); }
  }
  return { connections, WebSocket, setTimeout: (fn, delay) => { const id = ++next; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) };
}
const referenceEnv = environment(), referenceContext = vm.createContext(referenceEnv);
vm.runInContext(compiled.outputFiles[0].text, referenceContext);
const reference = vm.runInContext('new Reference.StreamDeckClient()', referenceContext);
const actionInfo = { action: 'de.heki.autoprofile.control', context: 'action-context', device: 'XL', payload: { settings: {} } };
await reference.connect('12345', 'ui-registration-uuid', 'registerPropertyInspector', {}, actionInfo);
referenceEnv.connections[0].open();
const nodes = Object.fromEntries(['pair', 'code', 'state', 'diagnostic', 'status'].map(id => [id, { disabled: false, value: '', textContent: '', select() {} }]));
const hekiEnv = environment(), hekiWindow = {};
vm.runInNewContext(await readFile('plugin/ui/pi.js', 'utf8'), { ...hekiEnv, window: hekiWindow, document: { querySelector: id => nodes[id.slice(1)] } });
hekiWindow.connectElgatoStreamDeckSocket('12345', 'ui-registration-uuid', 'registerPropertyInspector', '{}', JSON.stringify(actionInfo));
const heki = hekiEnv.connections[0]; heki.open();
assert.deepEqual(heki.sent[0], referenceEnv.connections[0].sent[0]);
for (const command of ['status', 'pair']) {
  if (command === 'pair') nodes.pair.onclick();
  const message = heki.sent.at(-1); await reference.send('sendToPlugin', message.payload);
  assert.deepEqual(message, referenceEnv.connections[0].sent.at(-1));
}
console.log('Unabhängiger Referenzvergleich bestanden: Registrierung, Status- und Code-Anforderung entsprechen dem sdpi StreamDeckClient (Commit bfd17677540da403e28ecc442110df77be4306ca). UI-UUID und Aktionskontext sind im Test verschieden.');
