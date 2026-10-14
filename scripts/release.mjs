import { mkdir,rm,cp,readdir,readFile,writeFile,stat,access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';
import { marked } from 'marked';
import { noticesFor } from './licenses.mjs';
const {version}=JSON.parse(await readFile('package.json','utf8'));const name=`PageDeck-${version}`;
const stage=`release/${name}`;
await access('dist/de.heki.autoprofile.sdPlugin/bin/plugin.js');
await mkdir('release',{recursive:true});await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});
await cp('dist/no-node',stage,{recursive:true});
await cp('dist/edge-extension',stage+'/edge-extension',{recursive:true});
await cp('windows',stage,{recursive:true});await cp('config',stage+'/config',{recursive:true});await cp('docs',stage+'/docs',{recursive:true});
const source=stage+'/source';await mkdir(source,{recursive:true});
for(const entry of ['src','scripts','tests','plugin','extension','packager','profiles','config','docs','windows','package.json','package-lock.json','tsconfig.json','.gitignore','.gitattributes','README.md','LICENSE'])await cp(entry,source+'/'+entry,{recursive:true});
await cp('README.md',stage+'/README.md');await cp('LICENSE',stage+'/LICENSE');
await cp('docs/Optionsvorschau.png',stage+'/Optionsvorschau.png');
const style='body{font:16px/1.65 system-ui,Segoe UI,sans-serif;color:#17332f;background:#f2f6f4;margin:0}main{max-width:1050px;margin:32px auto;background:white;padding:38px 48px;border:1px solid #d7e4dc;border-radius:14px}h1{line-height:1.2}h2{margin-top:32px;color:#126c59}a{color:#126c59}pre,code{font-family:Consolas,monospace;background:#f1f5f2}pre{padding:18px;overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{border:1px solid #d7e4dc;padding:9px;text-align:left}nav{display:flex;flex-wrap:wrap;gap:14px;border-bottom:1px solid #d7e4dc;padding-bottom:18px;margin-bottom:28px}.notice{border-left:4px solid #126c59;background:#eaf3ed;padding:14px}img{max-width:100%}@media(max-width:700px){main{margin:0;padding:20px}table{display:block;overflow:auto}}';
const docNames=['INSTALLATION','ARCHITEKTUR','BETRIEB','SICHERHEIT','FEHLERSUCHE','ABNAHME','TESTBERICHT'];
const titles=['Installation','Architektur','Betrieb & Update','Sicherheit','Fehlersuche','Hardware-Abnahme','Testbericht'];
function page(title,body,isRoot=false){const nav=docNames.map((n,i)=>`<a href="${isRoot?'docs/':''}${n}.html">${titles[i]}</a>`).join('');return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – PageDeck</title><style>${style}</style></head><body><main><nav>${isRoot?'': '<a href="../START-HIER.html">Start</a>'}${nav}</nav>${body}</main></body></html>`;}
for(const n of docNames){const md=await readFile(`docs/${n}.md`,'utf8');await writeFile(`${stage}/docs/${n}.html`,page(n,marked.parse(md)));}
const intro=`
<h1>PageDeck</h1>
<p>Version ${version} · Automatischer Profilwechsel nach Webseite · Windows / Microsoft Edge / Stream Deck XL</p>
<div class="notice"><strong>Das gesamte Deck-Layout wechselt mit der aktiven Webseite, ohne Umschalttaste.</strong> Sie gestalten Ihre Profile in Stream Deck und binden die Exporte lokal ein. Es ist keine separate Node.js-Installation nötig.</div>
<h2>Einrichtung</h2>
<ol>
<li>Dieses ZIP vollständig in einen dauerhaften lokalen Ordner entpacken.</li>
<li>Die gewünschten vollständigen Profile in Stream Deck erstellen, zur Sicherung duplizieren und die Kopien als <code>.streamDeckProfile</code> exportieren.</li>
<li><a href="Profile-Paket-erstellen.html"><strong>Profile-Paket-erstellen.html öffnen</strong></a>. Alle gewünschten Exporte auswählen, eigene Profilkennungen vergeben und für das XL Gerätetyp 2 verwenden.</li>
<li>Das persönliche <code>.streamDeckPlugin</code> erstellen, herunterladen und per Doppelklick über Stream Deck installieren. Den Import Ihrer Profilkopien bestätigen.</li>
<li>In Edge unter <code>edge://extensions</code> den Entwicklermodus aktivieren und die entpackte Erweiterung aus <code>edge-extension</code> laden. Unternehmensrichtlinien müssen dies erlauben.</li>
<li>In einem Einrichtungsprofil „PageDeck → Automatik / Kopplung“ platzieren und im Stream-Deck-Editor auswählen. Im Einstellungsbereich einen Code erzeugen und innerhalb von zwei Minuten in den Edge-Einstellungen zum Koppeln eingeben.</li>
<li>In Edge „+ Neue Regel“ wählen, eigene Domain eintragen, ein eingebundenes Profil auswählen und speichern.</li>
<li>Die Webseite in den Vordergrund bringen. Das vollständige Profil soll automatisch wechseln. Mit einer zweiten Webseite und einem zweiten Layout prüfen.</li>
</ol>
<p>Die Profilvorbereitung läuft vollständig lokal, ohne Upload. Falls lokale HTML-Dateien gesperrt sind, zuerst die Edge-Erweiterung laden und die enthaltene Profilvorbereitung über deren Einstellungen öffnen.</p>
<h2>Hotkeys, Eingaben und eigene Abläufe</h2>
<p>Alle Tasten gestalten Sie direkt in Stream Deck: Hotkeys, Texte, Makros, Ordner und Aktionen Ihrer installierten Plugins. PageDeck übernimmt die automatische Auswahl des passenden Layouts. Benötigte Drittplugins müssen auf diesem Rechner installiert sein.</p>
<h2>Profile und Regeln ändern</h2>
<p>Domain, Pfad oder Priorität für bereits eingebundene Profile ändern Sie nur in Edge. Neue oder überarbeitete Profile erfordern ein neues persönliches Paket mit höherer Revision. Dabei immer alle weiter benötigten Exporte auswählen; bearbeitete Profilkopien vorher erneut exportieren. Zur Profilbearbeitung die Automatik pausieren.</p>
<p>Die offizielle SDK-Schnittstelle kann nur im Plugin registrierte Profile aktivieren. Das zusätzlich enthaltene <code>PageDeck-${version}-Basis.streamDeckPlugin</code> enthält deshalb noch keine eigenen Layouts und dient nur der Kopplungsdiagnose. Für den normalen Betrieb installieren Sie das persönlich erzeugte Paket.</p>
<h2>Update</h2>
<p>Ein neues persönliches Paket mit Ihren Exporten erstellen und installieren. Edge-Dateien am bisherigen Erweiterungsort ersetzen und die Erweiterung neu laden. Stream Deck vollständig beenden und neu starten. Bestehende Profilregeln und Kopplung bleiben bei gleicher Erweiterungs-ID erhalten. Eine aktive Pause bei Bedarf aufheben. Die Webseiten-Tasten aus 2.0 sind entfernt; deren Tastenfolgen müssen als native Stream-Deck-Profile gestaltet werden.</p>
<h2>Geprüfter Stand</h2>
<p>31 Kernprüfungen, offizielle Elgato-Validierung sowie Chromium-Prüfungen für Regeln, persönliche Paketvorbereitung und Kopplung bestanden. SDK-Profilbefehle werden ohne auslösenden Tastendruck geprüft. Der Stream-Deck-Host und Chrome-APIs sind teilweise simuliert; das sichtbare Layout und die Installation auf Windows/Edge/XL müssen vor Ort abgenommen werden. Keine Marketplace-Veröffentlichung.</p>
<h2>Oberfläche</h2>
<img src="Optionsvorschau.png" alt="PageDeck-Regeloberfläche: eine Website wird einem vollständigen Deck-Profil zugeordnet">
<p>Quellen und Entwicklerwerkzeuge liegen in <code>source/</code>. Die Navigation führt zu Bedienung, Erweiterung, Fehlersuche und Abnahme.</p>`;
await writeFile(stage+'/START-HIER.html',page('Start',intro,true));
await writeFile(stage+'/THIRD-PARTY-NOTICES.md',await noticesFor(['@elgato/streamdeck','@elgato/utils','@elgato/schemas','ws','fflate']));
async function files(root,prefix=''){let out=[];for(const e of (await readdir(root,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const relative=prefix+e.name;out.push(...(e.isDirectory()?await files(root+'/'+e.name,relative+'/'):[relative]));}return out;}
const checks=[];for(const file of await files(stage))checks.push(createHash('sha256').update(await readFile(stage+'/'+file)).digest('hex')+'  '+file);
await writeFile(stage+'/SHA256SUMS.txt',checks.join('\n')+'\n');
const entries={};for(const file of await files(stage))entries[name+'/'+file]=[new Uint8Array(await readFile(stage+'/'+file)),{mtime:new Date('2026-01-01T00:00:00Z')}];
const zipped=zipSync(entries,{level:9});await writeFile('release/'+name+'.zip',zipped);await writeFile('release/'+name+'.zip.sha256',createHash('sha256').update(zipped).digest('hex')+'  '+name+'.zip\n');
console.log(`Release erstellt: release/${name}.zip (${zipped.length} Bytes, ${Object.keys(entries).length} Dateien)`);
