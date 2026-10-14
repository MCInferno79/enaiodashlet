import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocketServer } from 'ws';
import { mkdir,mkdtemp,readFile,writeFile,rm } from 'node:fs/promises';
import path from 'node:path';
import { until } from './helpers.mjs';

test('Update migriert Kopplung und Pause zu PageDeck und erhält vorhandene neue Einstellungen',async t=>{
  await mkdir('work',{recursive:true});const temp=await mkdtemp(path.resolve('work/migration-'));
  const appdata=temp+'/appdata',previous=appdata+'/HeKI-AutoProfile',current=appdata+'/PageDeck';
  const origin='chrome-extension://'+'a'.repeat(32),oldToken='b'.repeat(64),newToken='c'.repeat(64);
  await mkdir(previous,{recursive:true});
  const originalPairing=JSON.stringify({origin,token:oldToken}),originalState=JSON.stringify({paused:true});
  await writeFile(previous+'/pairing.json',originalPairing);await writeFile(previous+'/state.json',originalState);
  const host=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>host.once('listening',r));
  let child;let stderr='';
  async function stop(){if(child&&child.exitCode===null){child.kill();await until(()=>child.exitCode!==null||child.signalCode!==null);}}
  t.after(async()=>{await stop();for(const c of host.clients)c.terminate();await new Promise(r=>host.close(r));await rm(temp,{recursive:true,force:true});});
  const manifest=JSON.parse(await readFile('dist/de.heki.autoprofile.sdPlugin/manifest.json','utf8'));
  const info={application:{version:'7.5.1.22901',platform:'windows',platformVersion:'10',language:'de',font:'Segoe UI'},plugin:{uuid:manifest.UUID,version:manifest.Version},devicePixelRatio:1,colors:{},devices:[]};
  async function boot(token){
    const env={...process.env,APPDATA:appdata};delete env.PAGEDECK_TEST_DATA_DIR;
    child=spawn(process.execPath,['bin/plugin.js','-port',String(host.address().port),'-pluginUUID',manifest.UUID,'-registerEvent','registerPlugin','-info',JSON.stringify(info)],{cwd:path.resolve('dist/de.heki.autoprofile.sdPlugin'),env,stdio:['ignore','ignore','pipe']});
    child.stderr.on('data',b=>{stderr+=b;});
    const status=await until(async()=>{
      assert.equal(child.exitCode,null,stderr);
      try{const response=await fetch('http://127.0.0.1:29381/v1/status',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});return response.status===200?response.json():false;}catch{return false;}
    });return status;
  }
  assert.equal((await boot(oldToken)).paused,true);
  assert.equal(await readFile(current+'/pairing.json','utf8'),originalPairing);
  assert.equal(await readFile(current+'/state.json','utf8'),originalState);
  await stop();
  await writeFile(current+'/pairing.json',JSON.stringify({origin,token:newToken}));
  await writeFile(current+'/state.json',JSON.stringify({paused:false}));
  assert.equal((await boot(newToken)).paused,false);
  assert.equal(JSON.parse(await readFile(current+'/pairing.json','utf8')).token,newToken);
  assert.equal(await readFile(previous+'/pairing.json','utf8'),originalPairing);
  assert.equal(await readFile(previous+'/state.json','utf8'),originalState);
});
