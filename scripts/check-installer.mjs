// Developer-side fixture only; no real user profile is generated or shipped.
import { build } from 'esbuild';
import { readFile,writeFile,rm,mkdir } from 'node:fs/promises';
import { unzipSync,zipSync,strToU8 } from 'fflate';
import path from 'node:path';
const code=(await build({entryPoints:['src/packager/package.ts'],platform:'node',format:'esm',bundle:true,write:false})).outputFiles[0].text;
const {personalize}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const {version}=JSON.parse(await readFile('package.json','utf8'));
const base=new Uint8Array(await readFile('dist/packager-base.zip'));
const fixture=zipSync({'fixture.txt':strToU8('Opaque test fixture. Not a real Stream Deck profile.')});
const result=await personalize(base,[{key:'BBB',label:'BBB test',deviceType:2,fileName:'test.streamDeckProfile',bytes:fixture}],1);
await rm('work/installer-check',{recursive:true,force:true});
for(const [name,bytes] of Object.entries(unzipSync(result.bytes))){const target=path.join('work/installer-check',name);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);}
console.log('Browser-Paketformat für separate offizielle CLI-Validierung vorbereitet.');
