import { DEFAULT_CONFIG, validateConfig, matchRule, type Config } from "../shared/config";
const BASE = "http://127.0.0.1:29381";
type Auth = { token: string };
type Status = { instance: string; paused: boolean; profiles: { key: string; label: string; deviceType: number }[]; devices: { id: string; name: string; type: number; size: { columns: number; rows: number }; isConnected: boolean }[]; results: { deviceId: string; profile: string | null; state: string }[] };
let pending = false, running = false, revision = 0;
async function api(route: string, data: unknown, token?: string) {
  const response = await fetch(BASE + route, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data), cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(2500) });
  const body = await response.json();
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Kopplung fehlt oder wurde erneuert. Bitte erneut koppeln." : response.status === 429 ? "Zu viele Kopplungsversuche. Eine Minute warten." : response.status === 409 ? "Verbindung wurde neu gestartet. Erneuter Versuch folgt." : "Lokaler Dienst: Anfrage abgelehnt.");
  return body;
}
async function settings(): Promise<{ config: Config; auth?: Auth }> {
  const v = await chrome.storage.local.get(["config", "auth"]);
  const candidate = v.auth as Auth | undefined;
  return { config: validateConfig(v.config ?? DEFAULT_CONFIG), auth: candidate && /^[a-f0-9]{64}$/.test(candidate.token) ? candidate : undefined };
}
async function saveStatus(s: Record<string, unknown>) { await chrome.storage.session.set({ status: { ...s, updatedAt: Date.now() } }); }
async function activeTab(): Promise<{ focused: boolean; url: string }> {
  const windows = await chrome.windows.getAll({ windowTypes: ["normal", "popup"] });
  const window = windows.find(w => w.focused);
  if (!window || window.id === undefined) return { focused: false, url: "" };
  const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
  return { focused: !!tab, url: tab?.url ?? "" };
}
async function evaluate() {
  const mine = revision;
  const { config, auth } = await settings();
  const active = await activeTab();
  const match = matchRule(active.url, config.rules);
  if (!auth?.token) { await saveStatus({ connected: false, host: match.host, message: "Bitte zuerst mit dem Stream-Deck-Plugin koppeln." }); return; }
  try {
    const server: Status = await api("/v1/status", {}, auth.token);
    if (mine !== revision) { pending = true; return; }
    const n = await chrome.storage.local.get("sequence");
    const sequence = typeof n.sequence === "number" && Number.isSafeInteger(n.sequence) ? n.sequence + 1 : 1;
    await chrome.storage.local.set({ sequence });
    // Re-read focus immediately before sending; no URL or host leaves this worker.
    const latest = await activeTab();
    if (mine !== revision || latest.focused !== active.focused || latest.url !== active.url) { pending = true; return; }
    const target = match.rule?.profile ?? (config.unknown === "default" ? config.defaultProfile : null);
    const result: Status = await api("/v1/event", { instance: server.instance, sequence, focused: active.focused, target, keep: !match.rule && config.unknown === "keep", paused: config.paused, deviceIds: config.deviceIds }, auth.token);
    const missing = result.results.some(r => r.state === "profile-missing");
    const failed = result.results.some(r => r.state === "sdk-error");
    const paused = config.paused || result.paused;
    const selected = result.devices.filter(d => d.isConnected && (!config.deviceIds.length || config.deviceIds.includes(d.id)));
    const requested = result.results.some(r => r.state === "command-sent");
    let message = paused ? "Automatik pausiert – Profilfreigabe angefordert." : !active.focused ? "Edge im Hintergrund – Profilfreigabe angefordert." : selected.length === 0 ? "Kein ausgewähltes Stream Deck verbunden." : failed ? "Stream-Deck-Befehl fehlgeschlagen." : missing ? "Profil für dieses Gerät fehlt. Exportdatei mit Profile-Paket-erstellen.html lokal einbinden und das erzeugte Plugin installieren." : requested ? `Microsoft Edge erkannt – ${match.host || "interne Seite"} – Profilbefehl ${target ?? "beibehalten"} gesendet.` : "Keine passende Regel – Profilfreigabe angefordert.";
    await saveStatus({ connected: true, host: match.host, profile: target, message, server: result });
    await chrome.action.setBadgeText({ text: paused ? "Ⅱ" : missing || failed ? "!" : "" });
    await chrome.action.setBadgeBackgroundColor({ color: missing || failed ? "#b45309" : "#0f766e" });
  } catch (e) {
    await saveStatus({ connected: false, host: match.host, message: e instanceof TypeError || (e instanceof Error && e.name === "TimeoutError") ? "Lokaler Dienst nicht erreichbar. Stream Deck starten; erneuter Versuch beim nächsten Browserereignis oder innerhalb von etwa 30 Sekunden." : e instanceof Error ? e.message : "Verbindungsfehler." });
    await chrome.action.setBadgeText({ text: "!" });
  }
}
async function drain() {
  if (running) return; running = true;
  try { while (pending) { pending = false; await evaluate(); } }
  catch { await saveStatus({ connected: false, message: "Einstellungen oder Browserzustand konnten nicht gelesen werden." }); }
  finally { running = false; }
}
function schedule() { ++revision; pending = true; void drain(); }
// Synchronous top-level registration is essential for MV3 worker restarts.
chrome.tabs.onActivated.addListener(schedule);
chrome.tabs.onUpdated.addListener((_id, change, tab) => { if (tab.active && (change.url !== undefined || change.status === "complete")) schedule(); });
chrome.tabs.onCreated.addListener(schedule); chrome.tabs.onRemoved.addListener(schedule);
chrome.tabs.onReplaced.addListener(schedule); chrome.tabs.onAttached.addListener(schedule); chrome.tabs.onDetached.addListener(schedule);
chrome.windows.onFocusChanged.addListener(schedule); chrome.windows.onRemoved.addListener(schedule);
// History API and hash navigation in SPAs; URL is inspected only for the active focused tab.
chrome.webNavigation.onHistoryStateUpdated.addListener(e => { if (e.frameId === 0) schedule(); });
chrome.webNavigation.onReferenceFragmentUpdated.addListener(e => { if (e.frameId === 0) schedule(); });
chrome.runtime.onStartup.addListener(schedule);
chrome.runtime.onInstalled.addListener(() => { void chrome.storage.local.get("config").then(v => { if (!v.config) return chrome.storage.local.set({ config: DEFAULT_CONFIG }); }).then(schedule); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === "local" && (changes.config || changes.auth)) schedule(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === "pagedeck-reconnect") schedule(); });
chrome.action.onClicked.addListener(() => { void chrome.runtime.openOptionsPage(); });
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL("options.html")) return;
  const run = async () => {
    switch (message?.type) {
      case "status": { const v = await chrome.storage.session.get("status"); return { ok: true, status: v.status }; }
      case "refresh": schedule(); return { ok: true };
      case "save": { const config = validateConfig(message.config); await chrome.storage.local.set({ config }); schedule(); return { ok: true }; }
      case "pair": {
        if (typeof message.code !== "string" || !/^[a-f0-9]{48}$/.test(message.code)) throw new Error("Kopplungscode ungültig oder unvollständig.");
        const auth = await api("/v1/pair", { code: message.code }); await chrome.storage.local.set({ auth: { token: auth.token } }); schedule(); return { ok: true };
      }
      case "resume-plugin": { const { auth } = await settings(); if (!auth) throw new Error("Bitte koppeln."); await api("/v1/pause", { paused: false }, auth.token); schedule(); return { ok: true }; }
      default: throw new Error("Unbekannter Befehl.");
    }
  };
  void run().then(respond, e => respond({ ok: false, error: e instanceof Error ? e.message : "Fehler" })); return true;
});
// Only an availability/lease heartbeat. Tab navigation itself is event-driven.
void chrome.alarms.clear("heki-reconnect");
void chrome.alarms.create("pagedeck-reconnect", { periodInMinutes: 0.5 });
schedule();
