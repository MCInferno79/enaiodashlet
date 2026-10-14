import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Server } from 'node:http';
import type { Credentials } from './server';
export function createWebChannel(o:{server:Server; credentials:()=>Credentials|undefined; paused:()=>boolean; changed:()=>void; port?:number}) {
  const port=o.port??29381, wss=new WebSocketServer({noServer:true,maxPayload:16384,perMessageDeflate:false});
  let client:WebSocket|undefined, context='', labels=new Map<number,string>(), seen=0;
  const waiting=new Map<string,{resolve:(ok:boolean)=>void;timer:ReturnType<typeof setTimeout>}>();
  function clear() { context='';labels.clear();seen=0;for(const p of waiting.values()){clearTimeout(p.timer);p.resolve(false);}waiting.clear();o.changed(); }
  function reset() { const previous=client;client=undefined;previous?.close(1000);clear(); }
  function send(value:unknown) { if(client?.readyState===WebSocket.OPEN)client.send(JSON.stringify(value)); }
  o.server.on('upgrade',(req,socket,head)=>{
    const credentials=o.credentials();
    if(req.url!=='/v1/deck'||req.method!=='GET'||req.headers.host!==`127.0.0.1:${port}`||req.socket.remoteAddress!=='127.0.0.1'||!credentials||req.headers.origin!==credentials.origin){socket.destroy();return;}
    wss.handleUpgrade(req,socket,head,ws=>{
      let authenticated=false;
      const timer=setTimeout(()=>ws.close(1008),4000);
      ws.on('error',()=>{});
      ws.on('close',()=>{clearTimeout(timer);if(client===ws){client=undefined;clear();}});
      ws.on('message',bytes=>{
        let p:any;try{p=JSON.parse(bytes.toString());}catch{ws.close(1008);return;}
        if(!authenticated){
          const current=o.credentials();
          if(!current||current.origin!==req.headers.origin||p?.type!=='auth'||typeof p.token!=='string'||!/^[a-f0-9]{64}$/.test(p.token)||!timingSafeEqual(Buffer.from(p.token),Buffer.from(current.token))){ws.close(1008);return;}
          reset();authenticated=true;clearTimeout(timer);client=ws;seen=Date.now();send({type:'ready',paused:o.paused()});return;
        }
        if(client!==ws)return;
        seen=Date.now();
        if(p?.type==='layout'){
          if(typeof p.context!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.context)||!Array.isArray(p.buttons)||p.buttons.length>32){ws.close(1008);return;}
          const next=new Map<number,string>();
          for(const button of p.buttons){if(!button||typeof button!=='object'||!Number.isInteger(button.slot)||button.slot<1||button.slot>32||next.has(button.slot)||typeof button.label!=='string'||button.label.length>50||/[\u0000-\u001f]/.test(button.label)){ws.close(1008);return;}next.set(button.slot,button.label);}
          context=p.context;labels=next;o.changed();
        }else if(p?.type==='result'&&typeof p.requestId==='string'&&typeof p.ok==='boolean'){
          const pending=waiting.get(p.requestId);if(pending){waiting.delete(p.requestId);clearTimeout(pending.timer);pending.resolve(p.ok);}
        }
      });
    });
  });
  const timer=setInterval(()=>{if(client&&Date.now()-seen>60000)reset();else send({type:'ping',paused:o.paused()});},20000);timer.unref();
  return {
    reset,
    refresh(){send({type:"ping",paused:o.paused()});o.changed();},
    title(slot:number) { return !o.paused()?labels.get(slot):undefined; },
    async execute(slot:number):Promise<boolean>{
      if(o.paused()||!context||!labels.has(slot)||!client||client.readyState!==WebSocket.OPEN||Date.now()-seen>60000||waiting.size>=8)return false;
      const requestId=randomBytes(16).toString('hex');
      return new Promise(resolve=>{const timer=setTimeout(()=>{waiting.delete(requestId);resolve(false);},5000);waiting.set(requestId,{resolve,timer});send({type:'execute',context,slot,requestId,expires:Date.now()+4500});});
    },
    close(){clearInterval(timer);reset();for(const client of wss.clients)client.terminate();wss.close();}
  };
}
