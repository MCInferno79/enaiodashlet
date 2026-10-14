// Real built plugin + SDK + HTTP/WS + worker source + real page DOM.
// Only Stream Deck routing and Chrome extension APIs are simulated.
import assert from 'node:assert/strict';
import { WebSocketServer,WebSocket } from 'ws';
import { chromium } from 'playwright-core';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { cp,mkdir,mkdtemp,readFile,rm } from 'node:fs/promises';
import path from 'node:path';
import { start } from './worker-harness.mjs';
import { until } from './helpers.mjs';
await mkdir('work',{recursive:true});const temp=await mkdtemp(path.resolve('work/web-actions-'));
const root=temp+'/de.heki.autoprofile.sdPlugin';await cp('dist/de.heki.autoprofile.sdPlugin',root,{recursive:true});
const host=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>host.once('listening',r));
let sdk,child,browser,h;const messages=[],wire=[];
host.on('connection',ws=>{sdk=ws;ws.on('message',bytes=>messages.push(JSON.parse(bytes)));});
const pageServer=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>PageDeck Test</title><input id="name"><button id="submit">Übernehmen</button><output id="count">0</output><input id="password" type="password"><input id="quantity" type="number" value="7"><div style="height:3000px"></div><script>window.clicks=0;window.shortcuts=0;document.querySelector("#submit").onclick=()=>{document.querySelector("#count").textContent=String(++window.clicks)};document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.shiftKey&&e.key==="k")window.shortcuts++});</script>');});
await new Promise(r=>pageServer.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+pageServer.address().port+'/';
const info={application:{version:'7.5.1.22901',platform:'windows',platformVersion:'10',language:'de',font:'Segoe UI'},plugin:{uuid:'de.heki.autoprofile',version:'2.0.0.0'},devicePixelRatio:1,colors:{},devices:[{id:'XL',type:2,name:'XL',size:{columns:8,rows:4}}]};
const send=value=>sdk.send(JSON.stringify(value));
let stderr='';
try{
 child=spawn(process.execPath,[root+'/bin/plugin.js','-port',String(host.address().port),'-pluginUUID',info.plugin.uuid,'-registerEvent','registerPlugin','-info',JSON.stringify(info)],{cwd:root,env:{...process.env,HEKI_TEST_DATA_DIR:temp+'/data'},stdio:['ignore','ignore','pipe']});child.stderr.on('data',b=>{stderr+=b;});
 await until(()=>messages.some(m=>m.event==='registerPlugin')||child.exitCode!==null);assert.equal(child.exitCode,null,stderr);
 send({event:'willAppear',action:'de.heki.autoprofile.control',context:'control',device:'XL',payload:{controller:'Keypad',coordinates:{column:0,row:0},settings:{},isInMultiAction:false}});
 send({event:'propertyInspectorDidAppear',action:'de.heki.autoprofile.control',context:'control',device:'XL'});
 await until(()=>messages.some(m=>m.payload?.localServerReady));send({event:'sendToPlugin',action:'de.heki.autoprofile.control',context:'control',payload:{command:'pair'}});
 const code=(await until(()=>messages.find(m=>m.payload?.pairingCode))).payload.pairingCode;
 const origin='chrome-extension://'+'a'.repeat(32);
 const post=(route,body,token)=>fetch('http://127.0.0.1:29381'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 const paired=await post('/v1/pair',{code});assert.equal(paired.status,200);const auth=await paired.json();
 browser=await chromium.launchPersistentContext(temp+'/browser',{executablePath:process.env.HEKI_BROWSER_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage();await page.goto(url);
 class ExtensionSocket extends WebSocket{constructor(address){super(address,{headers:{Origin:origin}});}send(value){wire.push(JSON.parse(value));return super.send(value);}}
 const workspaces={version:1,websites:[{id:'demo',name:'Testseite',pattern:'127.0.0.1',priority:0,enabled:true,buttons:[{slot:1,label:'Eintragen',steps:[{type:'fill',target:'#name',value:'PageDeck Testtext'},{type:'hotkey',target:'#name',value:'Control+Shift+k'},{type:'click',target:'#submit',value:''}]},{slot:2,label:'Zahl',steps:[{type:'fill',target:'#quantity',value:'ungueltig'}]},{slot:3,label:'Einfuegen',steps:[{type:'text',target:'',value:'+'}]},{slot:4,label:'Scrollen',steps:[{type:'scroll',target:'',value:'600'}]},{slot:5,label:'Oeffnen',steps:[{type:'open',target:'',value:url+'other'}]}]}]};
 h=await start({auth,workspaces,profileSwitchingEnabled:false,config:{version:1,paused:false,unknown:'release',defaultProfile:'',deviceIds:[],rules:[]}},(address,options)=>fetch(address,{...options,headers:{...options.headers,Origin:origin}}),{globals:{WebSocket:ExtensionSocket},configure:(chrome,{tabs})=>{tabs.set(1,url);chrome.permissions={contains:async()=>true};chrome.scripting={executeScript:async({func,args})=>[{result:await page.evaluate(({source,args})=>{const run=(0,eval)('('+source+')');return run(...args);},{source:func.toString(),args})}]};}});
 send({event:'willAppear',action:'de.heki.autoprofile.web',context:'web-key',device:'XL',payload:{controller:'Keypad',coordinates:{column:0,row:0},settings:{slot:1},isInMultiAction:false}});
 await until(()=>messages.some(m=>m.context==='web-key'&&m.payload?.title==='Eintragen'));
 const press=()=>send({event:'keyDown',action:'de.heki.autoprofile.web',context:'web-key',device:'XL',payload:{controller:'Keypad',coordinates:{column:0,row:0},settings:{slot:1},isInMultiAction:false}});
 press();await until(async()=>(await page.locator('#count').textContent())==='1');assert.equal(await page.locator('#name').inputValue(),'PageDeck Testtext');assert.equal(await page.evaluate(()=>window.shortcuts),1);
 await until(()=>messages.some(m=>m.context==='web-key'&&m.event==='showOk'));
 // A delayed injection must not execute an old request after its deadline.
 const originalScript=h.chrome.scripting.executeScript;h.chrome.scripting.executeScript=async options=>{await new Promise(r=>setTimeout(r,4600));return originalScript(options);};
 press();await until(()=>h.session.webStatus?.message.includes('abgelaufen'),8000);assert.equal(await page.locator('#count').textContent(),'1');h.chrome.scripting.executeScript=originalScript;
 // Changing the key number uses SDK settings; invalid number data is rejected without erasing the old value.
 send({event:'didReceiveSettings',action:'de.heki.autoprofile.web',context:'web-key',device:'XL',payload:{settings:{slot:2},controller:'Keypad',coordinates:{column:0,row:0},isInMultiAction:false}});
 await until(()=>messages.at(-1)?.payload?.title==='Zahl');press();await until(()=>h.session.webStatus?.message.includes('nicht ausgeführt'));
 assert.equal(await page.locator('#quantity').inputValue(),'7');
 send({event:'didReceiveSettings',action:'de.heki.autoprofile.web',context:'web-key',device:'XL',payload:{settings:{slot:1},controller:'Keypad',coordinates:{column:0,row:0},isInMultiAction:false}});
 await until(()=>messages.at(-1)?.payload?.title==='Eintragen');
 // Losing Edge focus removes the binding; no action can reach the old page.
 h.windows[0].focused=false;h.chrome.windows.onFocusChanged.emit(-1);await until(()=>messages.at(-1)?.payload?.title==='PageDeck\n1');
 const before=await page.locator('#count').textContent();press();await until(()=>messages.some(m=>m.context==='web-key'&&m.event==='showAlert'));assert.equal(await page.locator('#count').textContent(),before);
 // Browser permission and pause are enforced at execution time, too.
 h.windows[0].focused=true;h.chrome.windows.onFocusChanged.emit(1);await until(()=>wire.at(-1)?.type==='layout'&&wire.at(-1).buttons.length===5);
 h.chrome.permissions.contains=async()=>false;press();await until(()=>h.session.webStatus?.message.includes('Zugriff fehlt'));assert.equal(await page.locator('#count').textContent(),'1');
 h.chrome.permissions.contains=async()=>true;await h.chrome.storage.local.set({config:{...h.local.config,paused:true}});await until(()=>h.session.webStatus?.message.includes('pausiert'));press();assert.equal(await page.locator('#count').textContent(),'1');
 // Remaining action types run through the same physical-key path.
 await h.chrome.storage.local.set({config:{...h.local.config,paused:false}});await until(()=>wire.at(-1)?.type==='layout'&&wire.at(-1).buttons.length===5);
 async function selectSlot(slot,title){const before=messages.length;send({event:'didReceiveSettings',action:'de.heki.autoprofile.web',context:'web-key',device:'XL',payload:{settings:{slot},controller:'Keypad',coordinates:{column:0,row:0},isInMultiAction:false}});await until(()=>messages.slice(before).some(m=>m.context==='web-key'&&m.payload?.title===title));}
 await page.locator('#name').fill('ABC');await page.locator('#name').evaluate(el=>{el.focus();el.setSelectionRange(1,2);});await selectSlot(3,'Einfuegen');press();await until(async()=>(await page.locator('#name').inputValue())==='A+C');
 await selectSlot(4,'Scrollen');press();await until(async()=>(await page.evaluate(()=>window.scrollY))===600);
 const originalUpdate=h.chrome.tabs.update;h.chrome.tabs.update=async(id,changes)=>{await originalUpdate(id,changes);await page.goto(changes.url);};
 await selectSlot(5,'Oeffnen');press();await until(()=>page.url()===url+'other');
 const clean=wire.filter(m=>m.type!=='auth');assert(!JSON.stringify(clean).includes('PageDeck Testtext'));assert(!JSON.stringify(clean).includes(url));assert(!JSON.stringify(clean).includes('#name'));
 const logs=await readFile(temp+'/data/service.log','utf8');assert(!logs.includes(auth.token));assert(!logs.includes('PageDeck Testtext'));
 console.log('Webseiten-Aktionen bestanden: echtes SDK-Tastenevent → authentifizierter WebSocket → ausgeführter Worker → reales DOM (Text, Seiten-Hotkey, Klick). Fokusverlust, fehlende Freigabe, Pause und datensparsame Nachrichten geprüft. Stream-Deck-Host und Chrome-APIs simuliert.');
}finally{
 if(browser)await browser.close();
 if(child?.exitCode===null){child.kill();await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>setTimeout(r,1000))]);if(child.exitCode===null)child.kill('SIGKILL');}
 for(const ws of host.clients)ws.terminate();await new Promise(r=>host.close(r));pageServer.closeAllConnections();await new Promise(r=>pageServer.close(r));await rm(temp,{recursive:true,force:true});
}
