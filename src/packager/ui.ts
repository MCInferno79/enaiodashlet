import { personalize, type ExportFile } from "./package";
declare const HEKI_BASE_PACKAGE: string;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const feedback = (text: string) => { el("status").textContent = text; };
let busy = false;

function row(key: string, label: string) {
  const tr = document.createElement("tr");
  const keyInput = document.createElement("input"); keyInput.value = key; keyInput.maxLength = 64; keyInput.setAttribute("aria-label", "Profilkennung");
  const labelInput = document.createElement("input"); labelInput.value = label; labelInput.maxLength = 100; labelInput.setAttribute("aria-label", "Anzeigename");
  const type = document.createElement("select"); type.setAttribute("aria-label", "Gerätetyp");
  for (const [value, text] of [[2, "Stream Deck XL · 32 Tasten"], [0, "Stream Deck / MK.2"], [1, "Stream Deck Mini"], [7, "Stream Deck +"], [9, "Stream Deck Neo"], [10, "Stream Deck Studio"], [13, "Stream Deck + XL"], [3, "Stream Deck Mobile"]] as const) {
    const option = document.createElement("option"); option.value = String(value); option.textContent = text; type.append(option);
  }
  const file = document.createElement("input"); file.type = "file"; file.accept = ".streamDeckProfile"; file.setAttribute("aria-label", "Exportdatei für " + label);
  const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Entfernen"; remove.addEventListener("click", () => { if (!busy) tr.remove(); });
  for (const child of [keyInput, labelInput, type, file, remove]) { const td = document.createElement("td"); td.append(child); tr.append(td); }
  el("profiles").append(tr);
}
row("Website", "Meine Website");
el("add").addEventListener("click", () => { if (!busy && el("profiles").children.length < 32) row("", ""); });
try { el<HTMLInputElement>("revision").value = String(Math.min(65535, Math.max(1, Number(localStorage.getItem("heki-package-revision") ?? 0) + 1))); } catch { /* Local file storage can be disabled by policy. */ }
el("build").addEventListener("click", () => { void build().catch(e => feedback(e instanceof Error ? e.message : "Paket konnte nicht erstellt werden.")); });
async function build() {
  if (busy) return; busy = true;
  const controls = [...document.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("input,button,select")];
  controls.forEach(c => { c.disabled = true; });
  el<HTMLAnchorElement>("download").hidden = true;
  try {
    feedback("Profile werden ausschließlich lokal gelesen und in ein neues Installationspaket kopiert …");
    const inputs: ExportFile[] = [];
    let total = 0;
    for (const tr of el("profiles").querySelectorAll("tr")) {
      const controls = tr.querySelectorAll("input"); const file = controls[2]!.files?.[0];
      if (!file) continue;
      total += file.size;
      if (file.size > 50 * 1024 * 1024 || total > 100 * 1024 * 1024) throw new Error("Höchstens 50 MiB je Profil und 100 MiB insgesamt auswählen.");
      inputs.push({ key: controls[0]!.value.trim(), label: controls[1]!.value.trim(), deviceType: Number(tr.querySelector("select")!.value), fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    }
    const base = Uint8Array.from(atob(HEKI_BASE_PACKAGE), c => c.charCodeAt(0));
    const revision = Number(el<HTMLInputElement>("revision").value);
    const result = await personalize(base, inputs, revision);
    const link = el<HTMLAnchorElement>("download");
    if (link.href.startsWith("blob:")) URL.revokeObjectURL(link.href);
    link.href = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: "application/octet-stream" }));
    link.download = `PageDeck-${result.version}.streamDeckPlugin`; link.hidden = false;
    feedback(`Paket ${result.version} mit ${result.profiles.length} Profil(en) fertig. Jetzt herunterladen und die .streamDeckPlugin-Datei per Doppelklick in Stream Deck installieren.`);
    try { localStorage.setItem("heki-package-revision", String(revision)); } catch { /* Only this non-sensitive number is remembered, never files or their contents. */ }
  } finally { busy = false; controls.forEach(c => { c.disabled = false; }); }
}
