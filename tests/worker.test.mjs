import { test } from 'node:test';
import assert from 'node:assert/strict';
import { until } from './helpers.mjs';
import { start } from './worker-harness.mjs';
test('MV3: aktives fokussiertes Fenster, SPA, Rückkehr und keine vertraulichen URLs im Transport',async()=>{
  const h=await start();await until(()=>h.events().length===1);assert.equal(h.events()[0].body.target,'BBB');
  h.tabs.set(2,'https://speakr.vw.intern.herten.de');h.chrome.tabs.onUpdated.emit(99,{url:h.tabs.get(2)},{active:false});assert.equal(h.events().length,1);
  h.windows[0].focused=false;h.windows[1].focused=true;h.chrome.windows.onFocusChanged.emit(2);await until(()=>h.events().at(-1).body.target==='Speakr');
  h.tabs.set(2,'https://heki.herten.de/dashboard?secret=abc');h.chrome.webNavigation.onHistoryStateUpdated.emit({frameId:0});await until(()=>h.events().at(-1).body.target==='HeKI');
  h.windows[1].focused=false;h.chrome.windows.onFocusChanged.emit(-1);await until(()=>h.events().at(-1).body.focused===false);
  h.windows[0].focused=true;h.chrome.windows.onFocusChanged.emit(1);await until(()=>h.events().at(-1).body.focused===true&&h.events().at(-1).body.target==='BBB');
  for(const r of h.events()){const data=JSON.stringify(r.body);assert(!/Raum-A|confidential|secret|bbb\.herten|https:/.test(data));}
  assert(!JSON.stringify(h.local).includes('confidential'));assert(!JSON.stringify(h.session).includes('Raum-A'));
});
test('MV3: Dienst später starten, Alarm-Wiederverbindung und Neustart mit persistenter Sequenz',async()=>{
  const h=await start();const first=h.events().at(-1).body.sequence;
  h.setOnline(false);h.chrome.tabs.onActivated.emit({tabId:1});await until(()=>h.session.status.connected===false);
  h.setOnline(true);h.chrome.alarms.onAlarm.emit({name:'heki-reconnect'});await until(()=>h.session.status.connected===true&&h.events().length===2);
  const restored=await start(h.local);await until(()=>restored.events().length===1);assert(restored.events()[0].body.sequence>first);
});
