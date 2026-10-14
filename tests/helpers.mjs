import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export async function moduleFor(name) {
  await mkdir('work/test-build',{recursive:true});
  const out=path.resolve('work/test-build/'+name.replaceAll('/','-')+'.mjs');
  await build({entryPoints:['src/'+name+'.ts'],outfile:out,bundle:true,platform:'node',target:'node22',format:'esm',external:['ws']});
  return import(pathToFileURL(out).href);
}
export async function until(fn,timeout=4000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw new Error('Testbedingung nicht innerhalb der Frist erfüllt.');}
export class EventHook { listeners=[];addListener=(f)=>this.listeners.push(f);emit=(...args)=>{for(const f of this.listeners)f(...args);}; }
