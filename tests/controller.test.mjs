import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleFor } from './helpers.mjs';
const {Controller}=await moduleFor('plugin/controller');
const xl={id:'XL',type:2,name:'Stream Deck XL',size:{columns:8,rows:4},isConnected:true};
const profiles=['BBB','HeKI','Standard'].map(key=>({key,label:key,deviceType:2,name:'profiles/'+key,sha256:''}));
const intent=(target,extra={})=>({focused:true,target,keep:false,paused:false,deviceIds:[],...extra});
test('BBB A → B deduplizieren; BBB → HeKI → BBB → Outlook ohne verschachtelte Overrides',async()=>{
  const calls=[];const c=new Controller(profiles,()=>[xl],async(id,p)=>calls.push([id,p]));
  await c.update(intent('BBB'));await c.update(intent('BBB'));await c.update(intent('HeKI'));await c.update(intent('BBB'));await c.update(intent(null,{focused:false}));
  assert.deepEqual(calls.map(x=>x[1]),['profiles/BBB',undefined,'profiles/HeKI',undefined,'profiles/BBB',undefined]);
  await c.update(intent('BBB'));assert.equal(calls.at(-1)[1],'profiles/BBB');
});
test('Pausieren, Fortsetzen, Standardprofil, unbekannte Website und keep',async()=>{
  const calls=[];const c=new Controller(profiles,()=>[xl],async(_,p)=>calls.push(p));
  await c.update(intent('BBB'));await c.update(intent(null,{keep:true}));assert.equal(calls.length,1);
  await c.setPaused(true);assert.equal(calls.at(-1),undefined);
  await c.update(intent('HeKI'));assert.equal(calls.length,2);
  await c.setPaused(false);assert.equal(calls.at(-1),'profiles/HeKI');
  await c.update(intent('Standard'));assert.equal(calls.at(-1),'profiles/Standard');
  await c.expire();assert.equal(calls.at(-1),undefined);
});
test('Gerätetypen und Geräteauswahl; fehlende Profile lösen keinen beliebigen Switch aus',async()=>{
  const calls=[];const c=new Controller(profiles,()=>[xl,{...xl,id:'other',type:0}],async(id,p)=>calls.push([id,p]));
  await c.update(intent('BBB'));assert.deepEqual(calls,[['XL','profiles/BBB']]);assert.equal(c.results.find(r=>r.deviceId==='other').state,'profile-missing');
  await c.update(intent('BBB',{deviceIds:['other']}));assert.equal(calls.at(-1)[1],undefined);
  await c.update(intent('Missing'));assert(c.results.every(r=>r.state==='profile-missing'));
});
test('Schnelle konkurrierende Ziele serialisieren und veraltetes Zwischenziel überspringen',async()=>{
  const calls=[];let unblock;const gate=new Promise(r=>unblock=r);
  const c=new Controller(profiles,()=>[xl],async(_,p)=>{calls.push(p);if(calls.length===1)await gate;});
  const a=c.update(intent('BBB'));const b=c.update(intent('HeKI'));const d=c.update(intent('Standard'));unblock();await Promise.all([a,b,d]);
  assert.deepEqual(calls,['profiles/BBB',undefined,'profiles/Standard']);
});
test('SDK-Fehler werden angezeigt und beim nächsten Ereignis erneut versucht',async()=>{
  let fail=true;const calls=[];const c=new Controller(profiles,()=>[xl],async(_,p)=>{if(fail)throw new Error('offline');calls.push(p);});
  await c.update(intent('BBB'));assert.equal(c.results[0].state,'sdk-error');fail=false;await c.reconcile();assert.deepEqual(calls,['profiles/BBB']);
});
test('Gerät erneut anschließen und Lease ablaufen lassen',async()=>{
  const calls=[];const c=new Controller(profiles,()=>[xl],async(_,p)=>calls.push(p));
  await c.update(intent('BBB'));c.disconnect('XL');await c.reconcile();assert.equal(calls.length,2);await c.expire();assert.equal(calls.at(-1),undefined);
});
