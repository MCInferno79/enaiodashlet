import { DEFAULT_CONFIG, validateConfig, type Config, type Rule } from "../shared/config";
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let config: Config;
let catalog: { key: string; label: string; deviceType: number }[] = [];
let serverDevices: { id: string; name: string; type: number; size: { columns: number; rows: number }; isConnected: boolean }[] = [];
const feedback = (s: string) => { el("feedback").textContent = s; };
async function message(data: unknown): Promise<any> { const r = await chrome.runtime.sendMessage(data); if (!r?.ok) throw new Error(r?.error ?? "Service Worker nicht erreichbar."); return r; }
function option(value: string, text: string) { const o = document.createElement("option"); o.value = value; o.textContent = text; return o; }
function fillProfiles(select: HTMLSelectElement, value: string, optional = false) {
  select.replaceChildren(); if (optional) select.append(option("", "Bitte auswählen"));
  const keys = new Set(catalog.map(p => p.key));
  if (value) keys.add(value);
  if (!keys.size) select.append(option("", "Noch keine Profile eingebunden"));
  for (const key of keys) { const p = catalog.find(p => p.key === key); select.append(option(key, p ? `${p.label} [${key}]` : `${key} – noch nicht eingebunden`)); }
  select.value = value;
}
function input(value: string, type = "text") { const i = document.createElement("input"); i.type = type; i.value = value; return i; }
function drawRules() {
  const tbody = el<HTMLTableSectionElement>("rules"); tbody.replaceChildren();
  config.rules.forEach((rule, index) => {
    const tr = document.createElement("tr"); tr.dataset.id = rule.id;
    const enabled = input("", "checkbox"); enabled.checked = rule.enabled; enabled.setAttribute("aria-label", `Regel ${index + 1} aktiviert`);
    const name = input(rule.name); name.maxLength = 100; name.required = true; name.setAttribute("aria-label", "Anzeigename");
    const pattern = input(rule.pattern); pattern.required = true; pattern.maxLength = 1024; pattern.setAttribute("aria-label", "Domain oder Pfadmuster");
    const profile = document.createElement("select"); fillProfiles(profile, rule.profile); profile.setAttribute("aria-label", "Plugin-Profil");
    const priority = input(String(rule.priority), "number"); priority.min = "-10000"; priority.max = "10000"; priority.required = true; priority.setAttribute("aria-label", "Priorität");
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Löschen";
    remove.addEventListener("click", () => { config = collect(); config.rules.splice(index, 1); drawRules(); });
    for (const child of [enabled, name, pattern, profile, priority, remove]) { const td = document.createElement("td"); td.append(child); tr.append(td); }
    tbody.append(tr);
  });
  el("missing").textContent = "Die Profilauswahl enthält ausschließlich eingebundene Exportprofile. Weitere Profile mit Profile-Paket-erstellen.html lokal ergänzen und das erzeugte Installationspaket öffnen.";
}
function drawDevices() {
  const select = el<HTMLSelectElement>("device-select"); select.replaceChildren(option("*", "Alle passenden Geräte"));
  const ids = new Set([...serverDevices.map(d => d.id), ...config.deviceIds]);
  for (const id of ids) { const d = serverDevices.find(d => d.id === id); select.append(option(id, d ? `${d.name} · Typ ${d.type} · ${d.size.columns} × ${d.size.rows}${d.isConnected ? "" : " · getrennt"}` : `${id} · derzeit unbekannt`)); }
  for (const o of select.options) o.selected = config.deviceIds.length === 0 ? o.value === "*" : config.deviceIds.includes(o.value);
}
function draw() { drawRules(); el<HTMLSelectElement>("unknown").value = config.unknown; fillProfiles(el("default-profile"), config.defaultProfile, true); el("pause").textContent = config.paused ? "Automatik fortsetzen" : "Automatik pausieren"; drawDevices(); }
function collect(): Config {
  const rules: Rule[] = [...el("rules").querySelectorAll("tr")].map(tr => {
    const inputs = tr.querySelectorAll("input");
    return { id: tr.dataset.id!, name: inputs[1]!.value, pattern: inputs[2]!.value, profile: tr.querySelector("select")!.value, priority: Number(inputs[3]!.value), enabled: inputs[0]!.checked };
  });
  const selected = [...el<HTMLSelectElement>("device-select").selectedOptions].map(o => o.value);
  return { ...config, rules, unknown: el<HTMLSelectElement>("unknown").value as Config["unknown"], defaultProfile: el<HTMLSelectElement>("default-profile").value, deviceIds: selected.includes("*") ? [] : selected };
}
async function updateStatus() {
  const { status } = await message({ type: "status" }); if (!status) return;
  el("status").textContent = status.message; el("connection").textContent = status.connected ? "Lokal verbunden" : "Nicht verbunden";
  el<HTMLButtonElement>("resume-plugin").hidden = !status.server?.paused;
  if (status.server) {
    const changed = JSON.stringify(catalog) !== JSON.stringify(status.server.profiles) || JSON.stringify(serverDevices) !== JSON.stringify(status.server.devices);
    if (changed) { config = collect(); catalog = status.server.profiles; serverDevices = status.server.devices; draw(); }
    el("devices").textContent = serverDevices.map(d => `${d.name}: Typ ${d.type}, ${d.size.columns} × ${d.size.rows}${d.isConnected ? "" : " (getrennt)"}`).join(" · ");
  }
}
function action(id: string, run: () => Promise<void> | void) { el(id).addEventListener("click", () => { Promise.resolve().then(run).catch(e => feedback(e.message)); }); }
el<HTMLFormElement>("form").addEventListener("submit", e => { e.preventDefault(); void (async () => { config = validateConfig(collect()); await message({ type: "save", config }); feedback("Einstellungen gespeichert."); })().catch(e => feedback(e.message)); });
action("add", () => { config = collect(); config.rules.push({ id: crypto.randomUUID(), name: "Neue Website", pattern: "example.org", profile: catalog[0]?.key ?? "", priority: 0, enabled: true }); drawRules(); });
action("test", async () => { await message({ type: "refresh" }); feedback("Verbindungstest angefordert; Status wird automatisch aktualisiert."); });
action("pause", async () => { config = validateConfig({ ...collect(), paused: !config.paused }); await message({ type: "save", config }); draw(); feedback(config.paused ? "Automatik pausiert." : "Automatik fortgesetzt."); });
action("resume-plugin", async () => { await message({ type: "resume-plugin" }); feedback("Pause am Stream Deck aufgehoben."); });
action("pair", async () => { await message({ type: "pair", code: el<HTMLInputElement>("pair-code").value.trim() }); el<HTMLInputElement>("pair-code").value = ""; feedback("Kopplung erfolgreich."); });
action("export", () => {
  const clean = validateConfig(collect()); const url = URL.createObjectURL(new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "pagedeck-regeln.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); feedback("Konfiguration exportiert. Kopplungsschlüssel werden nicht exportiert.");
});
el<HTMLInputElement>("import").addEventListener("change", e => { void (async () => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  if (file.size > 1024 * 1024) throw new Error("Datei zu groß.");
  config = validateConfig(JSON.parse(await file.text())); draw(); feedback("Konfiguration geprüft und geladen. Zum Übernehmen speichern.");
})().catch(e => feedback(e.message)); });
chrome.storage.onChanged.addListener((_changes, area) => { if (area === "session") void updateStatus().catch(e => feedback(e.message)); });
el<HTMLInputElement>("legacy-enabled").onchange=()=>{void message({type:"profiles:enable",enabled:el<HTMLInputElement>("legacy-enabled").checked}).catch(e=>feedback(e.message));};
const saved = await chrome.storage.local.get(["config","profileSwitchingEnabled"]);el<HTMLInputElement>("legacy-enabled").checked=saved.profileSwitchingEnabled===true; config = validateConfig(saved.config ?? DEFAULT_CONFIG); draw();
await message({ type: "refresh" }); await updateStatus();
