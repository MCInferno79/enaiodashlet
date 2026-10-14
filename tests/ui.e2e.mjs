// Ordinary local page rendering test, with chrome.* mocked. Does not install an extension.
import { chromium } from 'playwright-core';
import http from 'node:http';
import path from 'node:path';
import { readFile,mkdir,mkdtemp,rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=http.createServer(async(req,res)=>{const name=req.url==='/'?'options.html':req.url.slice(1);if(!['options.html','options.js','options.css','icon.png'].includes(name)){res.writeHead(404);return res.end();}const mime=name.endsWith('.html')?'text/html':name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'image/png';res.writeHead(200,{'Content-Type':mime});res.end(await readFile('dist/edge-extension/'+name));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));await mkdir('work',{recursive:true});const temp=await mkdtemp(path.resolve('work/ui-'));let context;
try{
  context=await chromium.launchPersistentContext(temp,{executablePath:process.env.HEKI_BROWSER_PATH??'/usr/bin/chromium',headless:true,viewport:{width:1280,height:1050},args:['--no-sandbox','--disable-dev-shm-usage']});
  await context.addInitScript(()=>{
    const listeners=[];let config;
    const server={paused:false,profiles:[{key:'BBB',label:'BBB',deviceType:2},{key:'HeKI',label:'HeKI',deviceType:2},{key:'Grafana',label:'HeKI / Grafana',deviceType:2},{key:'Speakr',label:'Speakr',deviceType:2}],devices:[{id:'TEST-XL',name:'Stream Deck XL · Testvorschau',type:2,size:{columns:8,rows:4},isConnected:true}],results:[]};
    window.chrome={storage:{local:{get:async()=>({config})},onChanged:{addListener:f=>listeners.push(f)}},runtime:{sendMessage:async m=>{if(m.type==='status')return{ok:true,status:{message:'Testvorschau – lokaler Verbindungsstatus. Hardware noch nicht abgenommen.',connected:true,server}};if(m.type==='save'){config=m.config;return{ok:true};}return{ok:true};}}};
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('#connection').getByText('Lokal verbunden').waitFor();assert.equal(await page.locator('#rules tr').count(),0);
  await page.locator('#add').click();assert.equal(await page.locator('#rules tr').count(),1);await page.locator('#rules tr').last().locator('button').click();assert.equal(await page.locator('#rules tr').count(),0);
  await page.locator('button[type=submit]').click();await page.locator('#feedback').getByText('Einstellungen gespeichert.').waitFor();
  await page.locator('#pause').click();await page.locator('#feedback').getByText('Automatik pausiert.').waitFor();await page.locator('#pause').click();
  await page.screenshot({path:'work/options-preview.png',fullPage:true});assert.equal(errors.length,0,errors.join('\n'));
  console.log('Optionsoberfläche in Chromium geprüft: Regeln hinzufügen/löschen, speichern und pausieren. chrome.* hierfür simuliert.');
}finally{if(context)await context.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true});}
