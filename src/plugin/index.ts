import streamDeck, { action, SingletonAction, type KeyDownEvent, type WillAppearEvent, type SendToPluginEvent, type DidReceiveSettingsEvent, type KeyAction } from "@elgato/streamdeck";
import { readFile, mkdir, rename, writeFile, appendFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Controller, type Device } from "./controller";
import { createBridge, type Credentials } from "./server";
import type { Profile } from "../shared/config";
import { inspectorMessages } from "./inspector";
import { createWebChannel } from "./web-channel";
streamDeck.logger.setLevel("error");

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = process.env.PAGEDECK_TEST_DATA_DIR ?? process.env.HEKI_TEST_DATA_DIR ?? path.join(process.env.APPDATA ?? path.join(process.cwd(), "data"), "HeKI-AutoProfile");
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
let webChannel: ReturnType<typeof createWebChannel> | undefined;
const bridge = createBridge({ controller, profiles, devices, credentials: stored,
  saveCredentials: c => atomic("pairing.json", c), savePaused: p => atomic("state.json", { paused: p }), credentialsChanged: () => webChannel?.reset(), pausedChanged: () => webChannel?.refresh() });
const status = () => ({ ...bridge.status(), pluginVersion: streamDeck.info.plugin.version, streamDeckVersion: streamDeck.info.application.version, localServerReady: bridge.server.listening });
const inspector = inspectorMessages({
  isVisible: context => streamDeck.ui.action?.id === context,
  send: payload => streamDeck.ui.sendToPropertyInspector(JSON.parse(JSON.stringify(payload))),
  status, beginPairing: () => bridge.beginPairing(), isServerReady: () => bridge.server.listening, log
});
async function notify() { await streamDeck.ui.sendToPropertyInspector(JSON.parse(JSON.stringify(status()))); }

@action({ UUID: "de.heki.autoprofile.control" })
class Control extends SingletonAction {
  override async onWillAppear(ev: WillAppearEvent) { if (ev.action.isKey()) await ev.action.setTitle(controller.isPaused ? "PageDeck\nPause" : "PageDeck"); }
  override async onKeyDown(_ev: KeyDownEvent) {
    const paused = !controller.isPaused; await atomic("state.json", { paused }); await controller.setPaused(paused);
    for (const a of this.actions) if (a.isKey()) await a.setTitle(paused ? "PageDeck\nPause" : "PageDeck");
    webChannel?.refresh(); await refreshWebTitles(); await notify();
  }
  override async onSendToPlugin(ev: SendToPluginEvent<any, any>) {
    await inspector.receive(ev.action.id, ev.payload);
  }
  override async onPropertyInspectorDidAppear(ev: { action: { id: string } }) { await inspector.didAppear(ev.action.id); }
}
type WebSettings = { slot?: number };
const webActions = new Map<string, { action: KeyAction<WebSettings>; slot: number }>();
async function refreshWebTitles() { await Promise.all([...webActions.values()].map(async({action,slot})=>{try{await action.setTitle(webChannel?.title(slot)??`PageDeck\n${slot}`);}catch{log("WEB_TITLE_FAILED");}})); }
webChannel = createWebChannel({ server:bridge.server, credentials:bridge.credentials, paused:()=>controller.isPaused, changed:()=>{void refreshWebTitles();} });
@action({ UUID: "de.heki.autoprofile.web" })
class WebsiteAction extends SingletonAction<WebSettings> {
  override async onWillAppear(ev:WillAppearEvent<WebSettings>) {
    if(!ev.action.isKey())return;
    let slot=ev.payload.settings.slot;
    if(!Number.isInteger(slot)||slot!<1||slot!>32){const xy='coordinates' in ev.payload?ev.payload.coordinates:undefined;const position=xy?xy.row*ev.action.device.size.columns+xy.column+1:1;slot=Math.min(32,Math.max(1,position));await ev.action.setSettings({...ev.payload.settings,slot});}
    webActions.set(ev.action.id,{action:ev.action,slot:slot!});await refreshWebTitles();
  }
  override async onDidReceiveSettings(ev:DidReceiveSettingsEvent<WebSettings>) { const slot=ev.payload.settings.slot;if(ev.action.isKey()&&Number.isInteger(slot)&&slot!>=1&&slot!<=32){webActions.set(ev.action.id,{action:ev.action,slot:slot!});await refreshWebTitles();} }
  override onWillDisappear(ev:{action:{id:string}}) {webActions.delete(ev.action.id);}
  override async onKeyDown(ev:KeyDownEvent<WebSettings>) {
    if(!ev.action.isKey())return;
    const slot=webActions.get(ev.action.id)?.slot??ev.payload.settings.slot??1;
    const ok=await webChannel!.execute(slot);log(ok?"WEB_ACTION_OK":"WEB_ACTION_FAILED");if(ok)await ev.action.showOk();else await ev.action.showAlert();
  }
  override async onSendToPlugin(ev:SendToPluginEvent<any,any>){await inspector.receive(ev.action.id,ev.payload);}
  override async onPropertyInspectorDidAppear(ev:{action:{id:string}}){await inspector.didAppear(ev.action.id);}
}
streamDeck.actions.registerAction(new Control());
streamDeck.actions.registerAction(new WebsiteAction());
streamDeck.devices.onDeviceDidConnect(() => { void controller.reconcile().catch(() => log("DEVICE_RECONCILE_FAILED")); });
streamDeck.devices.onDeviceDidDisconnect(ev => controller.disconnect(ev.device.id));
streamDeck.system.onSystemDidWakeUp(() => { void controller.expire().catch(() => log("WAKE_RELEASE_FAILED")); });
// Merely opening a deep-link can wake supported host versions; no untrusted payload is executed.
streamDeck.system.onDidReceiveDeepLink(() => { log("WAKE_LINK_RECEIVED"); });
let shuttingDown = false;
async function shutdown() { if (shuttingDown) return; shuttingDown = true; log("STOP"); webChannel?.close(); await bridge.close(); await logQueue; process.exit(0); }
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
