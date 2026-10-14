import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ZipReader, Uint8ArrayReader, Uint8ArrayWriter } from '@zip.js/zip.js';
import { zipSync } from 'fflate';
import { noticesFor } from './licenses.mjs';
const out='dist/de.heki.autoprofile.sdPlugin';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
await cp('plugin',out,{recursive:true}); await cp('profiles',out+'/profiles',{recursive:true});
await cp('extension','dist/edge-extension',{recursive:true});
await build({ entryPoints:['src/plugin/index.ts'], outfile:out+'/bin/plugin.js', platform:'node', target:'node24', format:'esm', bundle:true, banner:{js:'import { createRequire as __pageDeckCreateRequire } from "node:module"; const require = __pageDeckCreateRequire(import.meta.url);'}, legalComments:'linked' });
for(const name of ['worker','options']) await build({entryPoints:[`src/extension/${name}.ts`],outfile:`dist/edge-extension/${name}.js`,bundle:true,format:'esm',platform:'browser',target:'chrome120',legalComments:'linked'});
// Small original PNG artwork; generated during build without network resources.
function png(size, plain=false) {
  const crc32=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  const chunk=(name,data)=>{let n=Buffer.from(name),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(data.length);c.writeUInt32BE(crc32(Buffer.concat([n,data])));return Buffer.concat([l,n,data,c]);};
  return import('node:zlib').then(({deflateSync})=>{const data=Buffer.alloc((1+size*4)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){let i=y*(1+size*4)+1+x*4;const h=x>size*.25&&x<size*.38&&y>size*.2&&y<size*.8||x>size*.3&&x<size*.7&&(y>size*.2&&y<size*.32||y>size*.45&&y<size*.57)||x>size*.61&&x<size*.74&&y>size*.27&&y<size*.5;data.set(h&&!plain?[240,255,248,255]:[18,108,89,255],i);}const ih=Buffer.alloc(13);ih.writeUInt32BE(size,0);ih.writeUInt32BE(size,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);});
}
await mkdir(out+'/assets',{recursive:true});
for(const [name,size] of [['plugin',256],['plugin@2x',512],['category',28],['category@2x',56],['action',20],['action@2x',40],['key',72],['key@2x',144]]) await writeFile(`${out}/assets/${name}.png`,await png(size,name==='key'||name==='key@2x'));
await writeFile('dist/edge-extension/icon.png',await png(128));
await writeFile(out+'/package.json',JSON.stringify({type:'module',private:true},null,2));
// Manifest entries are built from the opaque, user-provided exports only.
const catalog=JSON.parse(await readFile(out+'/profiles/catalog.json','utf8'));
const manifest=JSON.parse(await readFile(out+'/manifest.json','utf8'));
manifest.Profiles=catalog.map(p=>({Name:p.name,DeviceType:p.deviceType,Readonly:false,AutoInstall:true,DontAutoSwitchWhenInstalled:true}));
await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));
console.log('Build erstellt: Edge-Erweiterung und Stream-Deck-Plugin. Eingebundene Exportprofile: '+catalog.length);
// The user's PC does NOT run this build script, npm or the CLI.
const {version}=JSON.parse(await readFile('package.json','utf8'));
await writeFile(out+'/THIRD-PARTY-NOTICES.md',await noticesFor(['@elgato/streamdeck','@elgato/utils','@elgato/schemas','ws']));
await mkdir('dist/no-node',{recursive:true});
await promisify(execFile)(process.execPath,['node_modules/@elgato/cli/bin/streamdeck.mjs','pack',out,'--output','dist/no-node','--no-update-check','--no-file-list','--force']);
const official=await readFile('dist/no-node/de.heki.autoprofile.streamDeckPlugin');
await writeFile(`dist/no-node/PageDeck-${version}-Basis.streamDeckPlugin`,official);
await rm('dist/no-node/de.heki.autoprofile.streamDeckPlugin');
await cp('packager','dist/no-node',{recursive:true});
// Official CLI emits ZIP64 even for tiny files. Read it with the same ZIP library
// as the CLI, then embed a bounded classic ZIP for the browser's fflate decoder.
const reader=new ZipReader(new Uint8ArrayReader(new Uint8Array(official)),{useWebWorkers:false});
const seedEntries={};
for(const entry of await reader.getEntries())if(!entry.directory)seedEntries[entry.filename]=[await entry.getData(new Uint8ArrayWriter()),{mtime:new Date('2026-01-01T00:00:00Z')}];
await reader.close();
const seed=zipSync(seedEntries,{level:6});await writeFile('dist/packager-base.zip',seed);
await build({entryPoints:['src/packager/ui.ts'],outfile:'dist/no-node/profile-packager.js',bundle:true,format:'iife',platform:'browser',target:'chrome120',define:{PAGEDECK_BASE_PACKAGE:JSON.stringify(Buffer.from(seed).toString('base64'))},legalComments:'linked'});
for(const file of ['Profile-Paket-erstellen.html','profile-packager.css','profile-packager.js','profile-packager.js.LEGAL.txt']){
  try{await cp('dist/no-node/'+file,'dist/edge-extension/'+file);}catch(e){if(e.code!=='ENOENT')throw e;}
}
console.log('Offizieller .streamDeckPlugin-Installer und lokale Profilvorbereitung ohne Node-Installation erstellt.');
