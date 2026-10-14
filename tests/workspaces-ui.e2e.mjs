import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile,mkdir,mkdtemp,rm } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const server=http.createServer(async(req,res)=>{const file=req.url==='/'?'workspaces.html':req.url.slice(1);if(!['workspaces.html','workspaces.js','options.css'].includes(file)){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});res.end(await readFile('dist/edge-extension/'+file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));await mkdir('work',{recursive:true});const temp=await mkdtemp(path.resolve('work/workspaces-ui-'));let browser;
try{
 browser=await chromium.launchPersistentContext(temp,{executablePath:process.env.HEKI_BROWSER_PATH??'/usr/bin/chromium',headless:true,viewport:{width:1280,height:1000},args:['--no-sandbox','--disable-dev-shm-usage']});
 await browser.addInitScript(()=>{let config={version:1,websites:[]};window.chrome={runtime:{sendMessage:async p=>{if(p.type==='workspaces:get')return {ok:true,config,status:{connected:true,message:'Testvorschau · lokal verbunden'}};if(p.type==='workspaces:save'){config=p.config;window.saved=config;}return {ok:true};}},permissions:{request:async p=>{window.requestedOrigins=p.origins;return true;}},storage:{onChanged:{addListener(){}},local:{get:async()=>({})}}};});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('#empty').waitFor();assert.equal(await page.locator('#site-list option').count(),0);
 await page.locator('#add-site').click();await page.locator('#site-name').fill('Mein Portal');await page.locator('#site-pattern').fill('portal.example.org/tasks');await page.locator('#grant').click();await page.locator('#permission').getByText('Website freigegeben.').waitFor();
 await page.locator('#add-button').click();await page.locator('#button-label').fill('Suchen');await page.locator('[data-field=type]').selectOption('fill');await page.locator('[data-field=target]').fill('#query');await page.locator('[data-field=value]').fill('Suchtext');
 await page.locator('#add-step').click();await page.locator('.step').last().locator('[data-field=target]').fill('#search');assert.equal(await page.locator('.step').last().locator('[data-field=value]').isVisible(),false);await page.locator('#save').click();await page.locator('#feedback').filter({hasText:'gespeichert'}).waitFor();
 const saved=await page.evaluate(()=>window.saved);assert.equal(saved.websites[0].pattern,'portal.example.org/tasks');assert.equal(saved.websites[0].buttons[0].steps.length,2);assert.equal(saved.websites[0].buttons[0].steps[0].value,'Suchtext');assert.deepEqual(await page.evaluate(()=>window.requestedOrigins),['http://portal.example.org/*','https://portal.example.org/*']);
 await page.screenshot({path:'work/pagedeck-preview.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PageDeck-Oberfläche geprüft: neutraler Start, Webseite, gezielte Freigabe, Taste, zwei Schritte und Speichern. Chrome-APIs hierfür simuliert.');
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true});}
