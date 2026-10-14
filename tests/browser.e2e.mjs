// Real Chromium/Edge extension -> real HTTP bridge -> real @elgato/streamdeck SDK.
// Only the Stream Deck application/hardware is simulated. No real profile export is faked for shipping.
import { chromium } from 'playwright-core';
import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import { mkdtemp,mkdir,cp,readFile,writeFile,rm,access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { until } from './helpers.mjs';
await mkdir('work',{recursive:true});
const fixture=JSON.parse(await readFile('tests/fixtures/profiles-config.json','utf8'));
const temp=await mkdtemp(path.resolve('work/browser-'));
const pluginRoot=temp+'/de.heki.autoprofile.sdPlugin';
const messages=[],browserErrors=[],transports=[];let socket,child,context,worker;
const sdkHost=new WebSocketServer({host:'127.0.0.1',port:0});
await new Promise(r=>sdkHost.once('listening',r));
sdkHost.on('connection',s=>{socket=s;s.on('message',bytes=>messages.push(JSON.parse(bytes.toString())));});
try{
  await cp('dist/de.heki.autoprofile.sdPlugin',pluginRoot,{recursive:true});
  const catalog=['Meeting','Portal','Metrics','Calendar','Standard'].map(key=>({key,label:key,name:'profiles/'+key+'-type2',deviceType:2,sha256:'test-only'}));
  await writeFile(pluginRoot+'/profiles/catalog.json',JSON.stringify(catalog));
  const manifest=JSON.parse(await readFile(pluginRoot+'/manifest.json','utf8'));manifest.Profiles=catalog.map(p=>({Name:p.name,DeviceType:2,Readonly:false}));await writeFile(pluginRoot+'/manifest.json',JSON.stringify(manifest));
  const info={application:{version:'7.3.0',platform:'windows',platformVersion:'10',language:'de',font:'Segoe UI'},plugin:{uuid:'de.heki.autoprofile',version:'1.0.0.0'},devicePixelRatio:1,colors:{},devices:[{id:'TEST-XL',type:2,name:'Stream Deck XL (simuliert)',size:{columns:8,rows:4}}]};
  child=spawn(process.execPath,[pluginRoot+'/bin/plugin.js','-port',String(sdkHost.address().port),'-pluginUUID','de.heki.autoprofile','-registerEvent','registerPlugin','-info',JSON.stringify(info)],{cwd:pluginRoot,env:{...process.env,PAGEDECK_TEST_DATA_DIR:temp+'/data'},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',x=>{stderr+=x.toString();});
  await until(()=>messages.some(m=>m.event==='registerPlugin')||child.exitCode!==null);assert.equal(child.exitCode,null,stderr);
  const send=m=>socket.send(JSON.stringify(m));
  send({event:'deviceDidConnect',device:'TEST-XL',deviceInfo:info.devices[0]});
  send({event:'willAppear',action:'de.heki.autoprofile.control',context:'control-test',device:'TEST-XL',payload:{controller:'Keypad',coordinates:{column:0,row:0},settings:{},isInMultiAction:false}});
  send({event:'propertyInspectorDidAppear',action:'de.heki.autoprofile.control',context:'control-test',device:'TEST-XL'});
  await until(()=>messages.some(m=>m.payload?.localServerReady));
  send({event:'sendToPlugin',action:'de.heki.autoprofile.control',context:'control-test',payload:{command:'pair'}});
  const pairMessage=await until(()=>messages.find(m=>m.payload?.pairingCode));
  console.log('SDK-Host registriert, Kopplungscode über Property Inspector erzeugt.');
  let executable=process.env.PAGEDECK_BROWSER_PATH;
  if(!executable)for(const candidate of ['/usr/bin/chromium','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe']){try{await access(candidate);executable=candidate;break;}catch{}}
  if(!executable)throw new Error('PAGEDECK_BROWSER_PATH auf Chromium oder Microsoft Edge setzen.');
  context=await chromium.launchPersistentContext(temp+'/browser',{executablePath:executable,channel:'chromium',headless:true,viewport:{width:1280,height:1000},ignoreDefaultArgs:['--disable-extensions'],args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-extension-debugging',`--disable-extensions-except=${path.resolve('dist/edge-extension')}`,`--load-extension=${path.resolve('dist/edge-extension')}`]});
  context.setDefaultTimeout(8000);
  console.log('Browser gestartet.');
  if(!context.serviceWorkers().length){const cdp=await context.browser().newBrowserCDPSession();await cdp.send('Extensions.loadUnpacked',{path:path.resolve('dist/edge-extension')});await cdp.detach();}
  await context.route('https://**/*',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Dienstbesprechung allgemein</title><h1>Lokaler Navigationstest</h1>'}));
  context.on('request',r=>{if(r.url().startsWith('http://127.0.0.1:29381'))transports.push(r.postData()??'');});
  worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker',{timeout:8000});
  const id=new URL(worker.url()).hostname;
  await worker.evaluate(config=>chrome.storage.local.set({config}),fixture);
  const page=await context.newPage();page.on('pageerror',e=>browserErrors.push(e.message));await page.goto(`chrome-extension://${id}/options.html`);
  await page.locator('summary').click();await page.locator('#pair-code').fill(pairMessage.payload.pairingCode);await page.locator('#pair').click();
  await until(async()=> (await page.locator('#feedback').textContent()).includes('erfolgreich'),7000);
  await until(async()=> (await page.locator('#connection').textContent())==='Lokal verbunden');
  await page.screenshot({path:'work/options-preview.png',fullPage:true});
  const switches=()=>messages.filter(m=>m.event==='switchToProfile');
  await page.goto('https://meet.example.org/Raum-A?token=confidential');
  await until(()=>switches().at(-1)?.payload.profile==='profiles/Meeting-type2');
  const count=switches().length;await page.goto('https://meet.example.org/Raum-B?token=another');
  await until(async()=> (await worker.evaluate(()=>chrome.storage.session.get('status'))).status?.host==='meet.example.org');
  await new Promise(r=>setTimeout(r,100));assert.equal(switches().length,count);
  await page.goto('https://portal.example.org/dashboard');await until(()=>switches().at(-1)?.payload.profile==='profiles/Portal-type2');
  await page.evaluate(()=>history.pushState({},'','/dashboard/live?token=private'));await new Promise(r=>setTimeout(r,100));assert.equal(switches().at(-1).payload.profile,'profiles/Portal-type2');
  await page.goto('https://meet.example.org/Raum-C');await until(()=>switches().at(-1)?.payload.profile==='profiles/Meeting-type2');
  await page.goto('https://unbekannt.invalid/');await until(()=>switches().at(-1)&&!('profile' in switches().at(-1).payload));
  // Pause via actual options page, then navigate: no further profile command.
  await page.goto(`chrome-extension://${id}/options.html`);await page.locator('#pause').click();
  await until(async()=> (await page.locator('#feedback').textContent()).includes('pausiert'));
  const pausedCount=switches().length;await page.goto('https://meet.example.org/Raum-D');await new Promise(r=>setTimeout(r,150));assert.equal(switches().length,pausedCount);
  assert.equal(browserErrors.length,0,browserErrors.join('\n'));
  assert(!transports.join('\n').match(/Raum-|confidential|another|private|https:\/\/meet/));
  const sequence=switches().map(m=>m.payload.profile??'<release>');
  assert.deepEqual(sequence,['profiles/Meeting-type2','<release>','profiles/Portal-type2','<release>','profiles/Meeting-type2','<release>']);
  await writeFile('work/browser-test-result.json',JSON.stringify({date:new Date().toISOString(),browser:await context.browser().version(),sdk:'3.0.2',hardware:'simulated',passed:true,switches:sequence,checks:['real MV3 pairing and HTTP Origin','real SDK WebSocket commands','Meeting A to B deduplication','Meeting-Portal-Meeting and unknown release','SPA URL update','pause','no full URL in bridge transport','options UI without page errors']},null,2));
  console.log('Browser-/SDK-Integration erfolgreich: echte MV3-Erweiterung, Kopplung, Meeting → Portal → Meeting, Freigabe, SPA und Pause. Stream-Deck-Host simuliert.');
}finally{
  if(context)await context.close();
  if(child&&child.exitCode===null){child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>setTimeout(r,2000))]);if(child.exitCode===null)child.kill('SIGKILL');}
  for(const client of sdkHost.clients)client.terminate();await new Promise(r=>sdkHost.close(r));await rm(temp,{recursive:true,force:true});
}
