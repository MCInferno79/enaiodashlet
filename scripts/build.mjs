import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { zipSync } from 'fflate';
const out='dist/de.heki.autoprofile.sdPlugin';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
await cp('plugin',out,{recursive:true}); await cp('profiles',out+'/profiles',{recursive:true});
await cp('extension','dist/edge-extension',{recursive:true});
await build({ entryPoints:['src/plugin/index.ts'], outfile:out+'/bin/plugin.js', platform:'node', target:'node24', format:'esm', bundle:true, banner:{js:'import { createRequire as __hekiCreateRequire } from "node:module"; const require = __hekiCreateRequire(import.meta.url);'}, legalComments:'linked' });
for(const name of ['worker','options']) await build({entryPoints:[`src/extension/${name}.ts`],outfile:`dist/edge-extension/${name}.js`,bundle:true,format:'esm',platform:'browser',target:'chrome120',legalComments:'linked'});
// Small original PNG artwork; generated during build without network resources.
function png(size) {
  const crc32=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  const chunk=(name,data)=>{let n=Buffer.from(name),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(data.length);c.writeUInt32BE(crc32(Buffer.concat([n,data])));return Buffer.concat([l,n,data,c]);};
  return import('node:zlib').then(({deflateSync})=>{const data=Buffer.alloc((1+size*4)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){let i=y*(1+size*4)+1+x*4;const h=(x>size*.24&&x<size*.37||x>size*.63&&x<size*.76)&&y>size*.23&&y<size*.77||x>size*.3&&x<size*.7&&y>size*.44&&y<size*.56;data.set(h?[240,255,248,255]:[18,108,89,255],i);}const ih=Buffer.alloc(13);ih.writeUInt32BE(size,0);ih.writeUInt32BE(size,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);});
}
await mkdir(out+'/assets',{recursive:true});
for(const [name,size] of [['plugin',256],['plugin@2x',512],['category',28],['category@2x',56],['action',20],['action@2x',40],['key',72],['key@2x',144]]) await writeFile(`${out}/assets/${name}.png`,await png(size));
await writeFile('dist/edge-extension/icon.png',await png(128));
await writeFile(out+'/package.json',JSON.stringify({type:'module',private:true},null,2));
// Manifest entries are built from the opaque, user-provided exports only.
const catalog=JSON.parse(await readFile(out+'/profiles/catalog.json','utf8'));
const manifest=JSON.parse(await readFile(out+'/manifest.json','utf8'));
manifest.Profiles=catalog.map(p=>({Name:p.name,DeviceType:p.deviceType,Readonly:false,AutoInstall:true,DontAutoSwitchWhenInstalled:true}));
await writeFile(out+'/manifest.json',JSON.stringify(manifest,null,2));
console.log('Build erstellt: Edge-Erweiterung und Stream-Deck-Plugin. Eingebundene Exportprofile: '+catalog.length);
