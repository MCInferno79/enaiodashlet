import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { WebSocket } from 'ws';
import { moduleFor,until } from './helpers.mjs';
const {createWebChannel}=await moduleFor('plugin/web-channel');
const origin='chrome-extension://'+'a'.repeat(32),token='b'.repeat(64);
async function harness(t){
 const server=http.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let paused=false;let changed=0;
 const channel=createWebChannel({server,credentials:()=>({origin,token}),paused:()=>paused,changed:()=>{changed++;},port:server.address().port});
 t.after(async()=>{channel.close();await new Promise(r=>server.close(r));});
 return {channel,connect:async(o=origin)=>{const ws=new WebSocket('ws://127.0.0.1:'+server.address().port+'/v1/deck',{headers:{Origin:o}});const messages=[];ws.on('message',b=>messages.push(JSON.parse(b)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return {ws,messages};},pause:v=>{paused=v;},changed:()=>changed};
}
test('Tastenkanal verlangt gepinnte Origin und Authentifizierung; Code/Text bleibt im Browser',async t=>{
 const h=await harness(t);
 await assert.rejects(h.connect('https://foreign.example'));
 const bad=await h.connect();bad.ws.send(JSON.stringify({type:'auth',token:'c'.repeat(64)}));await new Promise(r=>bad.ws.once('close',r));assert.equal(h.channel.title(1),undefined);
 const {ws,messages}=await h.connect();ws.send(JSON.stringify({type:'auth',token}));await until(()=>messages.some(m=>m.type==='ready'));
 assert.equal(await h.channel.execute(1),false);
 ws.send(JSON.stringify({type:'layout',context:'context-1',buttons:[{slot:1,label:'Suchen'}]}));await until(()=>h.channel.title(1)==='Suchen');
 const result=h.channel.execute(1);const command=await until(()=>messages.find(m=>m.type==='execute'));
 assert.deepEqual(Object.keys(command).sort(),['context','expires','requestId','slot','type']);
 ws.send(JSON.stringify({type:'result',requestId:command.requestId,ok:true}));assert.equal(await result,true);
 h.pause(true);assert.equal(await h.channel.execute(1),false);h.pause(false);
 const pending=h.channel.execute(1);h.channel.reset();assert.equal(await pending,false);assert.equal(h.channel.title(1),undefined);
});
test('Ungültige Belegung beendet den Kanal und entfernt veraltete Tasten',async t=>{
 const h=await harness(t),{ws,messages}=await h.connect();ws.send(JSON.stringify({type:'auth',token}));await until(()=>messages.length);
 ws.send(JSON.stringify({type:'layout',context:'one',buttons:[{slot:1,label:'A'},{slot:1,label:'B'}]}));await new Promise(r=>ws.once('close',r));assert.equal(h.channel.title(1),undefined);
});
