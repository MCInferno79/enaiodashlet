import { EMPTY_WORKSPACES, originsFor, validateWorkspaces, websiteFor, type Website } from '../shared/workspaces';
import { runPageSteps } from './page-actions';
export type ActiveTab = { focused:boolean;url:string;tabId?:number };
export function createDeckLink(activeTab:()=>Promise<ActiveTab>) {
  let socket:WebSocket|undefined, token='', ready=false, paused=false;
  let binding:{context:string;tabId:number;url:string;site:Website;fingerprint:string}|undefined;
  let queue=Promise.resolve();
  const status=async(message:string,ok=false)=>{await chrome.storage.session.set({webStatus:{message,connected:ok,updatedAt:Date.now()}});};
  const send=(value:unknown)=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(value));};
  async function layout() {
    if(!ready)return;
    const config=await chrome.storage.local.get(['workspaces','config']);
    const sites=validateWorkspaces(config.workspaces??EMPTY_WORKSPACES), active=await activeTab();
    const site=active.focused&&!paused&&(config.config as {paused?:boolean}|undefined)?.paused!==true?websiteFor(active.url,sites):undefined;
    if(site&&active.tabId!==undefined){
      const fingerprint=JSON.stringify(site);
      if(!binding||binding.url!==active.url||binding.tabId!==active.tabId||binding.fingerprint!==fingerprint)binding={context:crypto.randomUUID(),tabId:active.tabId,url:active.url,site,fingerprint};
      send({type:'layout',context:binding.context,buttons:site.buttons.map(b=>({slot:b.slot,label:b.label}))});
      await status(`PageDeck bereit: ${site.name} · ${site.buttons.length} Taste(n).`,true);
    }else{binding=undefined;send({type:'layout',context:crypto.randomUUID(),buttons:[]});await status(paused||(config.config as {paused?:boolean}|undefined)?.paused===true?'PageDeck pausiert.':'Verbunden. Aktive Webseite hat keine Tastenbelegung.',true);}
  }
  async function execute(p:any) {
    if(!binding||p.context!==binding.context||!Number.isInteger(p.slot)||typeof p.requestId!=='string'||!/^[a-f0-9]{32}$/.test(p.requestId))return;
    const current=binding, source=socket;
    if(!Number.isFinite(p.expires)||p.expires<Date.now()||p.expires>Date.now()+6000){send({type:'result',requestId:p.requestId,ok:false});await status('Tastenanfrage abgelaufen. Bei Bedarf erneut drücken.',ready);return;}
    let ok=false,error='CONTEXT_CHANGED';
    try{
      const data=await chrome.storage.local.get(['workspaces','config']);
      const active=await activeTab(), site=websiteFor(active.url,validateWorkspaces(data.workspaces??EMPTY_WORKSPACES));
      if(!paused&&(data.config as {paused?:boolean}|undefined)?.paused!==true&&active.focused&&active.tabId===current.tabId&&active.url===current.url&&site&&JSON.stringify(site)===current.fingerprint){
        const button=site.buttons.find(b=>b.slot===p.slot);
        if(button){
          const dom=button.steps.filter(s=>s.type!=='open');
          if(dom.length && !(await chrome.permissions.contains({origins:originsFor(site.pattern)})))error='PERMISSION_REQUIRED';
          else{
            ok=true;
            if(dom.length){const result=await chrome.scripting.executeScript({target:{tabId:current.tabId,frameIds:[0]},func:runPageSteps,args:[dom,current.url,p.expires]});ok=result[0]?.result?.ok===true;error=result[0]?.result?.error??'PAGE_ACTION_FAILED';}
            if(ok&&button.steps.at(-1)?.type==='open'){
              const latest=await activeTab();
              if(Date.now()>p.expires||!latest.focused||latest.tabId!==current.tabId||latest.url!==current.url){ok=false;error='CONTEXT_CHANGED';}
              else await chrome.tabs.update(current.tabId,{url:button.steps.at(-1)!.value});
            }
          }
        }
      }
    }catch{ok=false;error='PAGE_ACTION_FAILED';}
    if(socket===source&&ready)send({type:'result',requestId:p.requestId,ok});
    await status(ok?'Aktion ausgeführt.':error==='REQUEST_EXPIRED'?'Tastenanfrage abgelaufen. Bei Bedarf erneut drücken.':error==='PERMISSION_REQUIRED'?'Website-Zugriff fehlt. In den PageDeck-Einstellungen „Website freigeben“ wählen.':error==='ELEMENT_NOT_FOUND'?'Element nicht gefunden. Selektor und aktive Seite prüfen.':error==='FIELD_UNSUPPORTED'?'Dieses Feld unterstützt die gewählte Texteingabe nicht.':error==='CONTEXT_CHANGED'?'Aktion verworfen: aktive Webseite oder Tastenbelegung hat sich geändert.':'Seitenaktion konnte nicht ausgeführt werden. Element, Freigabe und Seitentyp prüfen.',ready);
  }
  return {
    async sync(nextToken?:string){
      if(typeof WebSocket==='undefined')return;
      if(!nextToken){socket?.close();socket=undefined;token='';ready=false;binding=undefined;return;}
      if(socket&&token===nextToken&&socket.readyState<2){if(ready)await layout();return;}
      socket?.close();token=nextToken;ready=false;binding=undefined;
      const current=new WebSocket('ws://127.0.0.1:29381/v1/deck');socket=current;
      current.onopen=()=>{if(socket===current)send({type:'auth',token});};
      current.onmessage=event=>{
        if(socket!==current)return;
        let p:any;try{p=JSON.parse(event.data);}catch{return;}
        if(p?.type==='ready'||p?.type==='ping'){
          ready=true;paused=p.paused===true;send({type:'alive'});void layout().catch(()=>status('Webseiten-Konfiguration konnte nicht gelesen werden.'));
        }else if(p?.type==='execute'&&ready){queue=queue.then(()=>execute(p)).catch(()=>{});}
      };
      current.onclose=()=>{if(socket===current){ready=false;binding=undefined;void status('Tastenverbindung getrennt. Stream Deck starten oder Verbindung testen.');}};
      current.onerror=()=>{if(socket===current)void status('Tastenverbindung nicht erreichbar. Kopplung und Stream Deck prüfen.');};
    }
  };
}
