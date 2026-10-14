export type Rule = { id: string; name: string; pattern: string; profile: string; priority: number; enabled: boolean };
export type Config = { version: 1; paused: boolean; unknown: "release" | "keep" | "default"; defaultProfile: string; deviceIds: string[]; rules: Rule[] };
export type Profile = { key: string; label: string; deviceType: number; name: string; sha256: string };
const keyRE = /^[a-zA-Z0-9_-]{1,64}$/;
export const isKey = (s: unknown): s is string => typeof s === "string" && keyRE.test(s);
function plain(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
function short(v: unknown, n: number): v is string { return typeof v === "string" && v.length <= n && !/[\u0000-\u001f]/.test(v); }
export function parsePattern(pattern: string): { host: string; wildcard: boolean; path: string } {
  if (!short(pattern, 1024) || !pattern.trim() || pattern !== pattern.trim()) throw new Error("Ungültiges Domain-/Pfadmuster.");
  // No credentials, port, query or fragment in stored rules. No regular expressions.
  const bare = pattern.replace(/^https?:\/\//i, "");
  if (/[?#@\\\s:]/.test(bare)) throw new Error("Muster nur als Hostname und optional /Pfad angeben; keine Parameter, Ports oder Zugangsdaten.");
  const [rawHost = "", ...rest] = bare.split("/");
  const wildcard = rawHost.startsWith("*.");
  const ascii = new URL("https://" + (wildcard ? rawHost.slice(2) : rawHost)).hostname.toLowerCase().replace(/\.$/, "");
  if (ascii.length > 253 || !ascii.split(".").every(x => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(x))) throw new Error("Ungültiger Hostname.");
  const path = rest.length ? "/" + rest.join("/") : "";
  if (path.includes("*") || /%(?:2f|5c)/i.test(path) || path.split("/").some(x => x === "." || x === "..")) throw new Error("Pfad ohne Wildcards oder Punktsegmente angeben.");
  return { host: ascii, wildcard, path: path === "/" ? "" : path.replace(/\/$/, "") };
}
export function validateConfig(v: unknown): Config {
  if (!plain(v) || Object.keys(v).some(k => !["version", "paused", "unknown", "defaultProfile", "deviceIds", "rules"].includes(k))) throw new Error("Ungültige Konfiguration.");
  if (v.version !== 1 || typeof v.paused !== "boolean" || !["release", "keep", "default"].includes(String(v.unknown)) || !short(v.defaultProfile, 64) || (v.defaultProfile && !isKey(v.defaultProfile))) throw new Error("Ungültige Grundeinstellungen.");
  if (v.unknown === "default" && !v.defaultProfile) throw new Error("Standardprofil auswählen.");
  if (!Array.isArray(v.deviceIds) || v.deviceIds.length > 32 || !v.deviceIds.every(x => short(x, 128) && x.length > 0)) throw new Error("Ungültige Geräteauswahl.");
  if (!Array.isArray(v.rules) || v.rules.length > 200) throw new Error("Höchstens 200 Regeln zulässig.");
  const ids = new Set();
  const rules = v.rules.map(r => {
    if (!plain(r) || Object.keys(r).some(k => !["id", "name", "pattern", "profile", "priority", "enabled"].includes(k)) || !isKey(r.id) || ids.has(r.id) || !short(r.name, 100) || !r.name || !short(r.pattern, 1024) || !isKey(r.profile) || !Number.isInteger(r.priority) || Math.abs(Number(r.priority)) > 10000 || typeof r.enabled !== "boolean") throw new Error("Ungültige oder doppelte Regel.");
    ids.add(r.id); parsePattern(r.pattern); return { id: r.id, name: r.name, pattern: r.pattern, profile: r.profile, priority: r.priority as number, enabled: r.enabled };
  });
  return { version: 1, paused: v.paused, unknown: v.unknown as Config["unknown"], defaultProfile: v.defaultProfile, deviceIds: [...v.deviceIds] as string[], rules };
}
export function matchRule(rawUrl: string, rules: Rule[]): { rule?: Rule; host: string } {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return { host: "" }; }
  if (!["http:", "https:"].includes(url.protocol)) return { host: "" };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const matched = rules.filter(r => {
    if (!r.enabled) return false;
    const p = parsePattern(r.pattern);
    const hostOK = p.wildcard ? host.endsWith("." + p.host) && host !== p.host : host === p.host;
    return hostOK && (!p.path || url.pathname === p.path || url.pathname.startsWith(p.path + "/"));
  });
  // Stable ties: order in the options page. Larger priority wins.
  matched.sort((a, b) => b.priority - a.priority);
  return { host, rule: matched[0] };
}
export const DEFAULT_CONFIG: Config = {
  version: 1, paused: false, unknown: "release", defaultProfile: "", deviceIds: [],
  rules: []
};
