import { unzipSync, zipSync, strFromU8, strToU8, type Zippable } from "fflate";
import { isKey, type Profile } from "../shared/config";

const ROOT = "de.heki.autoprofile.sdPlugin/";
const MAX_FILE = 50 * 1024 * 1024;
const MAX_TOTAL = 100 * 1024 * 1024;
export type ExportFile = { key: string; label: string; deviceType: number; fileName: string; bytes: Uint8Array };

/** Prepare a NEW installer in memory; never open or rewrite installed profile files. */
export async function personalize(base: Uint8Array, inputs: ExportFile[], revision: number): Promise<{ bytes: Uint8Array; version: string; profiles: Profile[] }> {
  if (!Number.isInteger(revision) || revision < 1 || revision > 65535) throw new Error("Paketrevision muss zwischen 1 und 65535 liegen.");
  if (!inputs.length || inputs.length > 32) throw new Error("Mindestens ein, höchstens 32 Exportprofile auswählen.");
  // The base is the trusted, embedded output of the official Elgato pack command.
  if (base.length > 10 * 1024 * 1024) throw new Error("Basispaket ist zu groß.");
  let baseTotal = 0;
  const files = unzipSync(base, { filter: entry => {
    baseTotal += entry.originalSize;
    if (entry.originalSize > 4 * 1024 * 1024 || baseTotal > 10 * 1024 * 1024) throw new Error("Basispaket überschreitet die sichere Entpackgröße.");
    return true;
  } });
  if (Object.keys(files).some(p => !p.startsWith(ROOT) || p.includes("\\") || p.split("/").some(s => s === "." || s === ".."))) throw new Error("Basispaket enthält ungültige Pfade.");
  const manifestBytes = files[ROOT + "manifest.json"];
  const catalogBytes = files[ROOT + "profiles/catalog.json"];
  if (!manifestBytes || !catalogBytes || !files[ROOT + "bin/plugin.js"]) throw new Error("Basispaket unvollständig.");
  const manifest = JSON.parse(strFromU8(manifestBytes));
  const catalog: Profile[] = JSON.parse(strFromU8(catalogBytes));
  if (manifest.UUID !== "de.heki.autoprofile" || manifest.CodePath !== "bin/plugin.js" || manifest.SDKVersion !== 2 || !/^\d+\.\d+\.\d+\.\d+$/.test(manifest.Version) || !Array.isArray(catalog)) throw new Error("Basispaket passt nicht zu dieser PageDeck-Version.");
  const seen = new Set(catalog.map(p => p.key.toLowerCase() + ":" + p.deviceType));
  let total = 0;
  for (const input of inputs) {
    if (!isKey(input.key) || !input.label.trim() || input.label.length > 100 || /[\u0000-\u001f]/.test(input.label) || !Number.isInteger(input.deviceType) || input.deviceType < 0 || input.deviceType > 13) throw new Error("Profilkennung, Anzeigename oder Gerätetyp ungültig.");
    const identity = input.key.toLowerCase() + ":" + input.deviceType;
    if (seen.has(identity)) throw new Error("Doppelte Profilkennung für denselben Gerätetyp: " + input.key);
    seen.add(identity);
    if (!input.fileName.toLowerCase().endsWith(".streamdeckprofile") || input.bytes.length < 22 || input.bytes.length > MAX_FILE || input.bytes[0] !== 0x50 || input.bytes[1] !== 0x4b || input.bytes[2] !== 0x03 || input.bytes[3] !== 0x04) throw new Error("Bitte echte .streamDeckProfile-Exporte bis 50 MiB auswählen.");
    total += input.bytes.length;
    if (total > MAX_TOTAL) throw new Error("Die Exportprofile dürfen zusammen höchstens 100 MiB groß sein.");
    const name = `profiles/${input.key}-type${input.deviceType}`;
    const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(input.bytes)))].map(b => b.toString(16).padStart(2, "0")).join("");
    files[ROOT + name + ".streamDeckProfile"] = input.bytes;
    catalog.push({ key: input.key, label: input.label.trim(), deviceType: input.deviceType, name, sha256 });
  }
  const version = manifest.Version.split(".").slice(0, 3).join(".") + "." + revision;
  manifest.Version = version;
  manifest.Profiles = catalog.map(p => ({ Name: p.name, DeviceType: p.deviceType, Readonly: false, AutoInstall: true, DontAutoSwitchWhenInstalled: true }));
  files[ROOT + "manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  files[ROOT + "profiles/catalog.json"] = strToU8(JSON.stringify(catalog, null, 2));
  const entries: Zippable = Object.create(null);
  for (const key of Object.keys(files).sort()) {
    // Profile archives are already compressed. Their contents remain opaque and byte-identical.
    entries[key] = [files[key]!, { level: key.endsWith(".streamDeckProfile") ? 0 : 6, mtime: new Date("2026-01-01T00:00:00Z") }];
  }
  return { bytes: zipSync(entries), version, profiles: catalog };
}
