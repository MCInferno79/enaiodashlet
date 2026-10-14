import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const keyRE=/^[a-zA-Z0-9_-]{1,64}$/;
export async function addProfile(root,file,key,label,deviceType) {
  if(process.env.APPDATA&&path.resolve(root).toLowerCase().startsWith(path.resolve(process.env.APPDATA,'Elgato','StreamDeck').toLowerCase()+path.sep))throw new Error('Nur ein entpacktes Vorbereitungspaket bearbeiten, niemals eine laufende Stream-Deck-Installation.');
  if(!keyRE.test(key)||typeof label!=='string'||!label.trim()||label.length>100||/[\u0000-\u001f]/.test(label)||!Number.isInteger(deviceType)||deviceType<0||deviceType>13) throw new Error('Profilkennung, Name oder Gerätetyp ungültig.');
  if(path.extname(file).toLowerCase()!=='.streamdeckprofile') throw new Error('Eine offiziell exportierte .streamDeckProfile-Datei auswählen.');
  const size=(await stat(file)).size;if(size<4||size>100*1024*1024)throw new Error('Exportdatei ungültig oder größer als 100 MB.');
  const bytes=await readFile(file);
  if(bytes[0]!==0x50||bytes[1]!==0x4b)throw new Error('Exportdatei ist kein Stream-Deck-Profilarchiv.');
  const catalogPath=path.join(root,'profiles/catalog.json');
  const manifestPath=path.join(root,'manifest.json');
  const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
  if(catalog.some(p=>p.key.toLowerCase()===key.toLowerCase()&&p.deviceType===deviceType))throw new Error('Diese Kennung ist für den Gerätetyp bereits belegt. Für Updates eine neue Kennung verwenden oder das Paket aus einer Sicherung neu vorbereiten.');
  const name=`profiles/${key}-type${deviceType}`;
  const sha256=createHash('sha256').update(bytes).digest('hex');
  await mkdir(path.join(root,'profiles'),{recursive:true});
  await copyFile(file,path.join(root,name+'.streamDeckProfile'));
  catalog.push({key,label:label.trim(),deviceType,name,sha256});
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.Profiles=catalog.map(p=>({Name:p.name,DeviceType:p.deviceType,Readonly:false,AutoInstall:true,DontAutoSwitchWhenInstalled:true}));
  await writeFile(catalogPath,JSON.stringify(catalog,null,2));await writeFile(manifestPath,JSON.stringify(manifest,null,2));
  return {name,sha256};
}
async function main(){
  const root=path.resolve(process.argv[2]??'dist/de.heki.autoprofile.sdPlugin');
  const rl=createInterface({input:stdin,output:stdout});
  try{
    console.log('PageDeck – Exportprofile unverändert einbinden. Stream Deck vorher vollständig beenden.\nFür den optionalen Profilwechsel eigene Exportprofile auswählen.\nGerätetyp: XL = 2; MK.2 = 0; Mini = 1; + = 7; Neo = 9; + XL = 13.');
    while(true){
      const file=(await rl.question('\nPfad zur .streamDeckProfile-Datei (leer = Ende): ')).trim().replace(/^"|"$/g,'');if(!file)break;
      const key=(await rl.question('Profilkennung [Website]: ')).trim()||'Website';
      const label=(await rl.question('Anzeigename ['+key+']: ')).trim()||key;
      const deviceType=Number((await rl.question('SDK-Gerätetyp [2 = XL]: ')).trim()||'2');
      try{const result=await addProfile(root,file,key,label,deviceType);console.log('Eingebunden: '+result.name+'\nSHA256: '+result.sha256);}catch(e){console.error(e.message);process.exitCode=1;}
    }
    console.log('\nAnschließend Installieren.cmd ausführen. Bestehende Benutzerprofile wurden nicht verändert.');
  }finally{rl.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
