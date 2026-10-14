// Same static page served by a test-only server. HEKI_TEST_FILE_URL=1 tests the actual file:// URL.
import { chromium } from 'playwright-core';
import { unzipSync,zipSync,strToU8,strFromU8 } from 'fflate';
import { readFile,mkdir,mkdtemp,rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
const {version}=JSON.parse(await readFile('package.json','utf8'));
await mkdir('work',{recursive:true});const temp=await mkdtemp(path.resolve('work/packager-browser-'));let context;
const server=http.createServer(async(req,res)=>{const file=req.url==='/'?'Profile-Paket-erstellen.html':req.url.slice(1);if(!['Profile-Paket-erstellen.html','profile-packager.js','profile-packager.css','profile-packager.js.LEGAL.txt'].includes(file)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});res.end(await readFile('dist/no-node/'+file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
try{
  context=await chromium.launchPersistentContext(temp+'/browser',{executablePath:process.env.HEKI_BROWSER_PATH??'/usr/bin/chromium',headless:true,acceptDownloads:true,viewport:{width:1440,height:1100},args:['--no-sandbox','--disable-dev-shm-usage']});context.setDefaultTimeout(7000);
  const page=await context.newPage();const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin+'/'))network.push(r.url());});
  await context.route(/^https?:/,r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await page.goto(process.env.HEKI_TEST_FILE_URL==='1'?pathToFileURL(path.resolve('dist/no-node/Profile-Paket-erstellen.html')).href:origin);
  assert.equal(await page.locator('#profiles tr').count(),1);
  await page.locator('#build').click();await page.locator('#status').getByText('Mindestens ein, höchstens 32 Exportprofile auswählen.').waitFor();
  const profile=zipSync({'fixture.txt':strToU8('Opaque test profile fixture, never shipped as a real Stream Deck profile.')});
  await page.locator('#profiles tr').first().locator('input').first().fill('BBB');
  await page.locator('#profiles tr').first().locator('input[type=file]').setInputFiles({name:'BBB.streamDeckProfile',mimeType:'application/octet-stream',buffer:Buffer.from(profile)});
  await page.locator('#revision').fill('1');await page.locator('#build').click();
  try{await page.locator('#download').waitFor();}catch{throw new Error('Paketoberfläche: '+await page.locator('#status').textContent());}
  const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),`PageDeck-${version}.1.streamDeckPlugin`);
  const filename=temp+'/personalized.streamDeckPlugin';await download.saveAs(filename);
  const unpacked=unzipSync(new Uint8Array(await readFile(filename)));
  assert.deepEqual(unpacked['de.heki.autoprofile.sdPlugin/profiles/BBB-type2.streamDeckProfile'],profile);
  assert.equal(JSON.parse(strFromU8(unpacked['de.heki.autoprofile.sdPlugin/manifest.json'])).Profiles[0].DeviceType,2);
  await page.screenshot({path:'work/profile-packager-preview.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('Profilvorbereitung in Chromium bestanden: Auswahl, Download, bytegleiche Profilkopie; keine externen HTTP(S)-Anfragen. Statische Dateien wurden durch einen Testserver bereitgestellt.');
}finally{if(context)await context.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true});}
