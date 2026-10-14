import streamDeck, { action, SingletonAction, type KeyDownEvent, type WillAppearEvent, type SendToPluginEvent } from "@elgato/streamdeck";
import { readFile, mkdir, rename, writeFile, appendFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Controller, type Device } from "./controller";
import { createBridge, type Credentials } from "./server";
import type { Profile } from "../shared/config";
import { inspectorMessages } from "./inspector";
streamDeck.logger.setLevel("error");

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = process.env.HEKI_TEST_DATA_DIR ?? path.join(process.env.APPDATA ?? path.join(process.cwd(), "data"), "HeKI-AutoProfile");
await mkdir(dataRoot, { recursive: true, mode: 0o700 });
async function readJson(file: string, fallback: unknown): Promise<any> { try { return JSON.parse(await readFile(file, "utf8")); } catch (e: any) { if (e.code === "ENOENT") return fallback; throw new Error("Lokale Einstellungsdatei ungültig."); } }
const fileWrites = new Map<string, Promise<void>>();
function atomic(file: string, value: unknown) {
  const next = (fileWrites.get(file) ?? Promise.resolve()).catch(() => {}).then(async () => { const target = path.join(dataRoot, file); await writeFile(target + ".tmp", JSON.stringify(value), { mode: 0o600 }); await rename(target + ".tmp", target); });
  fileWrites.set(file, next); return next;
}
let logQueue = Promise.resolve();
function log(code: string) {
  // Fixed event codes only; never exception objects, request data, tokens, device names or URLs.
  logQueue = logQueue.then(async () => {
    const file = path.join(dataRoot, "service.log");
    if (await stat(file).then(s => s.size > 256000).catch(() => false)) await rename(file, file + ".1").catch(() => {});
    await appendFile(file, `${new Date().toISOString()} ${code}\n`, { mode: 0o600 });
  }).catch(() => {});
}
const profiles: Profile[] = await readJson(path.join(pluginRoot, "profiles", "catalog.json"), []);
const devices = (): Device[] => [...streamDeck.devices].map(d => ({ id: d.id, name: d.name, type: d.type, size: d.size, isConnected: d.isConnected }));
const controller = new Controller(profiles, devices, async (id, profile) => { await streamDeck.profiles.switchToProfile(id, profile); log(profile ? "PROFILE_COMMAND_SENT" : "PROFILE_RELEASE_SENT"); });
const stored = await readJson(path.join(dataRoot, "pairing.json"), undefined) as Credentials | undefined;
if (stored && (!/^chrome-extension:\/\/[a-p]{32}$/.test(stored.origin) || !/^[a-f0-9]{64}$/.test(stored.token))) throw new Error("Kopplungsdatei ungültig.");
const state = await readJson(path.join(dataRoot, "state.json"), { paused: false });
await controller.setPaused(state.paused === true);
const bridge = createBridge({ controller, profiles, devices, credentials: stored,
  saveCredentials: c => atomic("pairing.json", c), savePaused: p => atomic("state.json", { paused: p }) });
const status = () => ({ ...bridge.status(), pluginVersion: streamDeck.info.plugin.version, streamDeckVersion: streamDeck.info.application.version, localServerReady: bridge.server.listening });
const inspector = inspectorMessages({
  isVisible: context => streamDeck.ui.action?.id === context,
  send: payload => streamDeck.ui.sendToPropertyInspector(JSON.parse(JSON.stringify(payload))),
  status, beginPairing: () => bridge.beginPairing(), isServerReady: () => bridge.server.listening, log
});
async function notify() { await streamDeck.ui.sendToPropertyInspector(JSON.parse(JSON.stringify(status()))); }

@action({ UUID: "de.heki.autoprofile.control" })
class Control extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent) { if (ev.action.isKey()) await ev.action.setTitle(controller.isPaused ? "HeKI\nPause" : "HeKI\nAuto"); }
  override async onKeyDown(_ev: KeyDownEvent) {
    const paused = !controller.isPaused; await atomic("state.json", { paused }); await controller.setPaused(paused);
    for (const a of this.actions) if (a.isKey()) await a.setTitle(paused ? "HeKI\nPause" : "HeKI\nAuto");
    await notify();
  }
  override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
    await inspector.receive(ev.action.id, ev.payload);
  }
  override async onPropertyInspectorDidAppear(ev: { action: { id: string } }) { await inspector.didAppear(ev.action.id); }
}
streamDeck.actions.registerAction(new Control());
streamDeck.devices.onDeviceDidConnect(() => { void controller.reconcile().catch(() => log("DEVICE_RECONCILE_FAILED")); });
streamDeck.devices.onDeviceDidDisconnect(ev => controller.disconnect(ev.device.id));
streamDeck.system.onSystemDidWakeUp(() => { void controller.expire().catch(() => log("WAKE_RELEASE_FAILED")); });
// Merely opening a deep-link can wake supported host versions; no untrusted payload is executed.
streamDeck.system.onDidReceiveDeepLink(() => { log("WAKE_LINK_RECEIVED"); });
let shuttingDown = false;
async function shutdown() { if (shuttingDown) return; shuttingDown = true; log("STOP"); await bridge.close(); await logQueue; process.exit(0); }
process.once("SIGINT", () => void shutdown()); process.once("SIGTERM", () => void shutdown());
process.on("unhandledRejection", () => { log("UNHANDLED_REJECTION"); void controller.expire().finally(() => process.exit(1)); });
await streamDeck.connect();
let retryDelay = 1000;
while (!shuttingDown) {
  try { await bridge.listen(); }
  catch {
    log("LOCAL_PORT_UNAVAILABLE");
    await streamDeck.ui.sendToPropertyInspector({ ...status(), error: "Lokaler Port 29381 nicht verfügbar. Automatischer Wiederholungsversuch folgt." }).catch(() => log("PI_NOTIFY_FAILED"));
    await new Promise(resolve => setTimeout(resolve, retryDelay)); retryDelay = Math.min(retryDelay * 2, 30000);
    continue;
  }
  log("START"); await notify().catch(() => log("PI_NOTIFY_FAILED")); break;
}
