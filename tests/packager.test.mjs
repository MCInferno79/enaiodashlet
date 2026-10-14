import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unzipSync,zipSync,strToU8,strFromU8 } from 'fflate';
import { moduleFor } from './helpers.mjs';
import { ZipReader,Uint8ArrayReader,Uint8ArrayWriter } from '@zip.js/zip.js';
const {personalize}=await moduleFor('packager/package');
const version=JSON.parse(await readFile('package.json','utf8')).version;
const base=new Uint8Array(await readFile('dist/packager-base.zip'));
const original=zipSync({'fixture.txt':strToU8('Testfixture: opaque foreign plugin action settings. Not a real hardware profile.')});
const input={key:'Meeting',label:'Meeting / Besprechung',deviceType:2,fileName:'Meeting.streamDeckProfile',bytes:original};
const root='de.heki.autoprofile.sdPlugin/';
test('CLI-ZIP64 wird verlustfrei normalisiert; Entpackgrenzen verhindern übergroße Puffer',async()=>{
  const official=new Uint8Array(await readFile(`dist/no-node/PageDeck-${version}-Basis.streamDeckPlugin`));
  const reader=new ZipReader(new Uint8ArrayReader(official),{useWebWorkers:false});const normalized=unzipSync(base);
  try{for(const entry of await reader.getEntries())if(!entry.directory)assert.deepEqual(normalized[entry.filename],await entry.getData(new Uint8ArrayWriter()));}finally{await reader.close();}
  assert(Object.values(normalized).every(b=>b.buffer.byteLength<4*1024*1024));
  await assert.rejects(personalize(official,[input],1),/Entpackgröße/);
});
test('Offline-Paket: CLI-Basis erhalten, Exportarchive bytegleich kopieren und XL-Manifest registrieren',async()=>{
  const before=unzipSync(base);const result=await personalize(base,[input],1);const after=unzipSync(result.bytes);
  assert.equal(result.version,version+'.1');
  assert.deepEqual(after[root+'profiles/Meeting-type2.streamDeckProfile'],original);
  assert.deepEqual(original,unzipSync(result.bytes)[root+'profiles/Meeting-type2.streamDeckProfile']);
  for(const [name,bytes] of Object.entries(before))if(!name.endsWith('/manifest.json')&&!name.endsWith('/profiles/catalog.json'))assert.deepEqual(after[name],bytes,name);
  const manifest=JSON.parse(strFromU8(after[root+'manifest.json']));assert.equal(manifest.Version,version+'.1');
  assert.deepEqual(manifest.Profiles,[{Name:'profiles/Meeting-type2',DeviceType:2,Readonly:false,AutoInstall:true,DontAutoSwitchWhenInstalled:true}]);
  const catalog=JSON.parse(strFromU8(after[root+'profiles/catalog.json']));assert.equal(catalog[0].key,'Meeting');assert.match(catalog[0].sha256,/^[a-f0-9]{64}$/);
});
test('Offline-Paket lehnt leere Auswahl, doppelte Kennungen, ungültige Typen und Pfade ab',async()=>{
  await assert.rejects(personalize(base,[],1));
  for(const revision of [0,65536,NaN,1.5])await assert.rejects(personalize(base,[input],revision));
  for(const bad of [{...input,key:'../Meeting'},{...input,deviceType:99},{...input,fileName:'Meeting.zip'},{...input,bytes:new Uint8Array([80,75])},{...input,label:'x\nsecret'}])await assert.rejects(personalize(base,[bad],1));
  await assert.rejects(personalize(base,[input,{...input,key:'meeting'}],1));
  const differentTypes=await personalize(base,[input,{...input,deviceType:0}],2);assert.equal(differentTypes.profiles.length,2);
});
