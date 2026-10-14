import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const fixture=JSON.parse(await readFile('tests/fixtures/legacy-config.json','utf8'));
import { build } from 'esbuild';
import { EventHook,until } from './helpers.mjs';
const code=(await build({entryPoints:['src/extension/worker.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'chrome120'})).outputFiles[0].text;
export async function start(local={auth:{token:'a'.repeat(64)}},network,extra={}){
  local={config:structuredClone(fixture),profileSwitchingEnabled:true,...local};
  const requests=[],session={},windows=[{id:1,focused:true},{id:2,focused:false}];const tabs=new Map([[1,'https://bbb.herten.de/Raum-A?token=confidential'],[2,'https://heki.herten.de/dashboard']]);
  const storageChanged=new EventHook();
  const store=data=>({get:async keys=>Object.fromEntries((typeof keys==='string'?[keys]:keys).map(k=>[k,data[k]])),set:async values=>{Object.assign(data,values);storageChanged.emit(Object.fromEntries(Object.keys(values).map(k=>[k,{newValue:values[k]}])),data===local?'local':'session');}});
  const chrome={storage:{local:store(local),session:store(session),onChanged:storageChanged},tabs:{onActivated:new EventHook(),onUpdated:new EventHook(),onCreated:new EventHook(),onRemoved:new EventHook(),onReplaced:new EventHook(),onAttached:new EventHook(),onDetached:new EventHook(),query:async o=>[{id:o.windowId,url:tabs.get(o.windowId)}],update:async(id,changes)=>{tabs.set(id,changes.url);}},windows:{getAll:async()=>structuredClone(windows),onFocusChanged:new EventHook(),onRemoved:new EventHook()},webNavigation:{onHistoryStateUpdated:new EventHook(),onReferenceFragmentUpdated:new EventHook()},runtime:{id:'a'.repeat(32),getURL:p=>'chrome-extension://'+'a'.repeat(32)+'/'+p,onStartup:new EventHook(),onInstalled:new EventHook(),onMessage:new EventHook(),openOptionsPage:async()=>{}},alarms:{create:async()=>{},onAlarm:new EventHook()},action:{onClicked:new EventHook(),setBadgeText:async()=>{},setBadgeBackgroundColor:async()=>{}}};
  let online=true;
  const fetch=async(url,options)=>{
    if(!online)throw new TypeError('offline');const b=JSON.parse(options.body);requests.push({url,body:b});if(network)return network(url,options);
    const server={instance:'test-instance',paused:false,profiles:[{key:'BBB',label:'BBB',deviceType:2}],devices:[{id:'XL',isConnected:true}],results:[]};
    if(url.endsWith('/v1/event'))server.results=[{deviceId:'XL',profile:b.focused?b.target:null,state:b.focused&&b.target&&!b.paused?'command-sent':'released'}];
    return {ok:true,json:async()=>server};
  };
  if(extra.configure)extra.configure(chrome,{tabs,windows});
  vm.runInNewContext(code,{chrome,fetch,AbortSignal,URL,Error,TypeError,console,crypto,...extra.globals});
  await until(()=>session.status);
  return {local,session,requests,chrome,tabs,windows,setOnline:v=>{online=v;},events:()=>requests.filter(r=>r.url.endsWith('/v1/event'))};
}
