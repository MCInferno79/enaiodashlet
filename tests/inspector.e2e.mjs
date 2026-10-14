// Real inspector page + real SDK plugin; Stream Deck host routing is simulated.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { WebSocketServer } from 'ws';
import { chromium } from 'playwright-core';
import { until } from './helpers.mjs';
await mkdir('work', { recursive: true });
const temp = await mkdtemp(path.resolve('work/inspector-'));
const root = temp + '/de.heki.autoprofile.sdPlugin';
await cp('dist/de.heki.autoprofile.sdPlugin', root, { recursive: true });
const manifest = JSON.parse(await readFile(root + '/manifest.json', 'utf8'));
const action = 'de.heki.autoprofile.control', contextId = 'selected-action';
const info = { application: { version: '7.5.1.22901', platform: 'windows', platformVersion: '10', language: 'de', font: 'Segoe UI' }, plugin: { uuid: 'de.heki.autoprofile', version: manifest.Version }, devicePixelRatio: 1, colors: {}, devices: [{ id: 'XL', type: 2, name: 'Stream Deck XL', size: { columns: 8, rows: 4 } }] };
const host = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await new Promise(r => host.once('listening', r));
let pluginSocket, inspectorSocket, registered = false, dropPairing = false, browser, child;
const routingErrors = [];
const sendPlugin = message => pluginSocket.send(JSON.stringify(message));
host.on('connection', socket => socket.on('message', data => {
  try {
    const message = JSON.parse(data);
    if (message.event === 'registerPlugin') { pluginSocket = socket; registered = true; return; }
    if (message.event === 'registerPropertyInspector') { assert.equal(message.uuid, 'inspector-uuid'); inspectorSocket = socket; return; }
    if (socket === inspectorSocket && message.event === 'sendToPlugin') {
      assert.equal(message.context, 'inspector-uuid'); assert.equal(message.action, action);
      if (!(dropPairing && message.payload.command === 'pair')) sendPlugin({ ...message, context: contextId });
    } else if (socket === pluginSocket && message.event === 'sendToPropertyInspector' && inspectorSocket) inspectorSocket.send(JSON.stringify({ ...message, action, context: 'inspector-uuid' }));
  } catch (error) { routingErrors.push(error.message); }
}));
const web = http.createServer(async (req, res) => {
  const file = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!['index.html', 'pi.js'].includes(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : 'text/html' });
  res.end(await readFile(root + '/ui/' + file));
});
await new Promise(r => web.listen(0, '127.0.0.1', r));
let stderr = '';
try {
  child = spawn(process.execPath, [root + '/bin/plugin.js', '-port', String(host.address().port), '-pluginUUID', info.plugin.uuid, '-registerEvent', 'registerPlugin', '-info', JSON.stringify(info)], { cwd: root, env: { ...process.env, HEKI_TEST_DATA_DIR: temp + '/data' }, stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.on('data', bytes => { stderr += bytes; });
  await until(() => registered || child.exitCode !== null); assert.equal(child.exitCode, null, stderr);
  const log = () => readFile(temp + '/data/service.log', 'utf8').catch(() => '');
  await until(async () => (await log()).includes('START'));
  sendPlugin({ event: 'willAppear', action, context: contextId, device: 'XL', payload: { controller: 'Keypad', coordinates: { column: 0, row: 0 }, settings: {}, isInMultiAction: false } });
  browser = await chromium.launchPersistentContext(temp + '/browser', { executablePath: process.env.HEKI_BROWSER_PATH ?? '/usr/bin/chromium', headless: true, viewport: { width: 340, height: 540 }, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  browser.setDefaultTimeout(8000);
  const page = await browser.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + web.address().port);
  await page.evaluate(({ port, info, action, contextId }) => window.connectElgatoStreamDeckSocket(String(port), 'inspector-uuid', 'registerPropertyInspector', JSON.stringify(info), JSON.stringify({ action, context: contextId })), { port: host.address().port, info, action, contextId });
  // Request arrives before propertyInspectorDidAppear: the SDK initially has no visible UI.
  await until(async () => (await log()).includes('PI_REPLY_DEFERRED'));
  assert.equal(await page.locator('#pair').isDisabled(), false);
  sendPlugin({ event: 'propertyInspectorDidAppear', action, context: contextId, device: 'XL' });
  await page.locator('#state').filter({ hasText: 'PI10:' }).waitFor();
  await page.locator('#pair').click();
  await page.waitForFunction(() => /^[a-f0-9]{48}$/.test(document.querySelector('#code').value));
  const code = await page.locator('#code').inputValue();
  const response = await fetch('http://127.0.0.1:29381/v1/pair', { method: 'POST', headers: { Origin: 'chrome-extension://' + 'a'.repeat(32), 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  assert.equal(response.status, 200); const auth = await response.json(); assert.match(auth.token, /^[a-f0-9]{64}$/);
  dropPairing = true; await page.locator('#pair').click();
  await page.locator('#state').filter({ hasText: 'PI03:' }).waitFor();
  assert.equal(await page.locator('#code').inputValue(), '');
  assert.equal(await page.locator('#pair').isDisabled(), false);
  assert.match(await page.locator('#diagnostic').textContent(), /Lokaler Dienst: bereit/);
  assert.match(await page.locator('#diagnostic').textContent(), new RegExp(manifest.Version.replaceAll('.', '\\.')));
  await page.screenshot({ path: 'work/inspector-diagnostic-preview.png', fullPage: true });
  // Retry without restarting the page or plugin; the button must recover.
  dropPairing = false; await page.locator('#pair').click();
  await page.waitForFunction(() => /^[a-f0-9]{48}$/.test(document.querySelector('#code').value));
  assert.equal(await page.locator('#pair').isDisabled(), false);
  const retryCode = await page.locator('#code').inputValue();
  const retryResponse = await fetch('http://127.0.0.1:29381/v1/pair', { method: 'POST', headers: { Origin: 'chrome-extension://' + 'a'.repeat(32), 'Content-Type': 'application/json' }, body: JSON.stringify({ code: retryCode }) });
  assert.equal(retryResponse.status, 200);
  const events = await log(); assert(events.includes('PI_PAIR_REQUEST')); assert(!events.includes(code)); assert(!events.includes(auth.token));
  assert.deepEqual(errors, []); assert.deepEqual(routingErrors, []);
  console.log('Kopplungsprüfung bestanden: echte Chromium-Oberfläche → WebSocket → offizielles SDK → angezeigter Code → erfolgreiches lokales Pairing. Frühe Antwort, UI-Kennungsrouting, Timeout und erfolgreicher zweiter Klick ohne Neustart geprüft; Stream-Deck-Host simuliert.');
} finally {
  if (browser) await browser.close();
  if (child?.exitCode === null) { child.kill(); await Promise.race([new Promise(r => child.once('exit', r)), new Promise(r => setTimeout(r, 1000))]); if (child.exitCode === null) child.kill('SIGKILL'); }
  for (const socket of host.clients) socket.terminate();
  await new Promise(r => host.close(r)); web.closeAllConnections(); await new Promise(r => web.close(r));
  await rm(temp, { recursive: true, force: true });
}
