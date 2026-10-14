import { DEFAULT_CONFIG, validateConfig } from "../shared/config";
import { EMPTY_WORKSPACES, originsFor, validateWorkspaces, type Workspaces, type Website, type WebButton, type Step } from '../shared/workspaces';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let config:Workspaces=structuredClone(EMPTY_WORKSPACES), siteIndex=0, buttonIndex=0;
const site=()=>config.websites[siteIndex],button=()=>site()?.buttons[buttonIndex];
const feedback=(message:string)=>{el('feedback').textContent=message;};
async function message(value:unknown){const result=await chrome.runtime.sendMessage(value);if(!result?.ok)throw new Error(result?.error??'Hintergrunddienst nicht erreichbar.');return result;}
function option(value:string,label:string){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}
function draw(){
  const list=el<HTMLSelectElement>('site-list');list.replaceChildren(...config.websites.map((s,i)=>option(String(i),s.name)));list.value=String(siteIndex);
  el('empty').hidden=!!site();el('editor').hidden=!site();
  const s=site();if(!s)return;
  el('permission').textContent='Klicken und Texteingaben benötigen Ihre Freigabe für diese Website.';
  el<HTMLInputElement>('site-name').value=s.name;el<HTMLInputElement>('site-pattern').value=s.pattern;el<HTMLInputElement>('site-priority').value=String(s.priority);el<HTMLInputElement>('site-enabled').checked=s.enabled;
  const buttons=el<HTMLSelectElement>('button-list');buttons.replaceChildren(...s.buttons.map((b,i)=>option(String(i),`${b.slot} · ${b.label}`)));buttons.value=String(buttonIndex);
  el('button-editor').hidden=!button();const b=button();if(!b)return;
  const slots=el<HTMLSelectElement>('slot');slots.replaceChildren(...Array.from({length:32},(_,i)=>option(String(i+1),String(i+1))));slots.value=String(b.slot);el<HTMLInputElement>('button-label').value=b.label;
  drawSteps(b);
}
const types:[Step['type'],string][]=[['click','Element klicken'],['fill','Feld ausfüllen'],['text','Text einfügen'],['hotkey','Seiten-Tastenkürzel'],['scroll','Scrollen'],['open','Seite öffnen']];
function drawSteps(b:WebButton){
  el('steps').replaceChildren();
  b.steps.forEach((step,index)=>{
    const card=document.createElement('div');card.className='step';
    const row=document.createElement('div');row.className='row';const title=document.createElement('strong');title.textContent=`Schritt ${index+1}`;
    const remove=document.createElement('button');remove.type='button';remove.textContent='Schritt entfernen';remove.onclick=()=>{collect();b.steps.splice(index,1);draw();};row.append(title,remove);
    const grid=document.createElement('div');grid.className='step-grid';const typeLabel=document.createElement('label');typeLabel.textContent='Aktion';const type=document.createElement('select');type.dataset.field='type';type.append(...types.map(([id,label])=>option(id,label)));type.value=step.type;typeLabel.append(type);
    const targetLabel=document.createElement('label');targetLabel.textContent='Element (CSS-Selektor)';const target=document.createElement('input');target.dataset.field='target';target.value=step.target;target.placeholder=step.type==='text'?'Leer = fokussiertes Feld':'#speichern';targetLabel.append(target);targetLabel.hidden=['open','scroll'].includes(step.type);
    const valueLabel=document.createElement('label');valueLabel.textContent=step.type==='open'?'Zieladresse':step.type==='hotkey'?'Tastenkürzel':step.type==='scroll'?'Pixel (nach oben: negativ)':'Text';const value=document.createElement('textarea');value.dataset.field='value';value.value=step.value;value.rows=2;value.placeholder=step.type==='hotkey'?'Control+Shift+k':step.type==='open'?'https://example.org/':step.type==='scroll'?'600':'';valueLabel.append(value);valueLabel.hidden=step.type==='click';
    type.onchange=()=>{collect();draw();};grid.append(typeLabel,targetLabel);card.append(row,grid,valueLabel);el('steps').append(card);
  });
}
function collect(){
  const s=site();if(!s)return;
  s.name=el<HTMLInputElement>('site-name').value;s.pattern=el<HTMLInputElement>('site-pattern').value.trim();s.priority=Number(el<HTMLInputElement>('site-priority').value);s.enabled=el<HTMLInputElement>('site-enabled').checked;
  const b=button();if(!b)return;b.slot=Number(el<HTMLSelectElement>('slot').value);b.label=el<HTMLInputElement>('button-label').value;
  b.steps=[...el('steps').querySelectorAll('.step')].map(card=>({type:card.querySelector<HTMLSelectElement>('[data-field=type]')!.value as Step['type'],target:card.querySelector<HTMLInputElement>('[data-field=target]')!.value,value:card.querySelector<HTMLTextAreaElement>('[data-field=value]')!.value}));
}
function action(id:string,run:()=>void|Promise<void>){el(id).onclick=()=>{void Promise.resolve().then(run).catch(e=>feedback(e.message));};}
el<HTMLSelectElement>('site-list').onchange=()=>{const next=Number(el<HTMLSelectElement>('site-list').value);collect();siteIndex=next;buttonIndex=0;draw();};
el<HTMLSelectElement>('button-list').onchange=()=>{const next=Number(el<HTMLSelectElement>('button-list').value);collect();buttonIndex=next;draw();};
action('add-site',()=>{collect();if(config.websites.length>=100)throw new Error('Maximal 100 Webseiten.');config.websites.push({id:crypto.randomUUID(),name:'Neue Webseite',pattern:'example.org',priority:0,enabled:true,buttons:[]});siteIndex=config.websites.length-1;buttonIndex=0;draw();});
action('remove-site',()=>{config.websites.splice(siteIndex,1);siteIndex=Math.max(0,siteIndex-1);buttonIndex=0;draw();});
action('add-button',()=>{collect();const s=site();if(!s)return;const free=Array.from({length:32},(_,i)=>i+1).find(slot=>!s.buttons.some(b=>b.slot===slot));if(!free)throw new Error('Alle 32 Tastennummern sind belegt.');s.buttons.push({slot:free,label:'Neue Aktion',steps:[{type:'click',target:'',value:''}]});buttonIndex=s.buttons.length-1;draw();});
action('remove-button',()=>{collect();site()?.buttons.splice(buttonIndex,1);buttonIndex=Math.max(0,buttonIndex-1);draw();});
action('add-step',()=>{collect();const b=button();if(!b)return;if(b.steps.length>=10)throw new Error('Maximal 10 Schritte je Taste.');b.steps.push({type:'click',target:'',value:''});draw();});
// permissions.request must run directly inside the browser click handler.
el('grant').onclick=()=>{
  collect();const s=site();if(!s)return;
  try{const origins=originsFor(s.pattern);void chrome.permissions.request({origins}).then(granted=>{el('permission').textContent=granted?'Website freigegeben.':'Freigabe wurde nicht erteilt. Klicken und Texteingaben sind auf dieser Website nicht verfügbar.';}).catch(e=>feedback(e.message));}catch(e){feedback((e as Error).message);}
};
action('save',async()=>{collect();config=validateWorkspaces(config);await message({type:'workspaces:save',config});draw();feedback('Webseiten und Tasten gespeichert. Zum Testen die gewünschte Webseite in den Vordergrund bringen.');});
action('refresh',async()=>{await message({type:'refresh'});await updateStatus();});
action('pair',async()=>{await message({type:'pair',code:el<HTMLInputElement>('pair-code').value.trim()});el<HTMLInputElement>('pair-code').value='';feedback('Kopplung erfolgreich.');});
action('resume',async()=>{await message({type:'resume-plugin'});feedback('Pause am Deck aufgehoben.');});
action('pause',async()=>{const saved=await chrome.storage.local.get('config');const old=validateConfig(saved.config??DEFAULT_CONFIG);await message({type:'save',config:{...old,paused:!old.paused}});feedback(!old.paused?'PageDeck pausiert.':'PageDeck fortgesetzt.');});
action('export',()=>{collect();const clean=validateWorkspaces(config),url=URL.createObjectURL(new Blob([JSON.stringify(clean,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pagedeck-webseiten.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
el<HTMLInputElement>('import').onchange=()=>{void(async()=>{const file=el<HTMLInputElement>('import').files?.[0];if(!file)return;if(file.size>1000000)throw new Error('Datei ist zu groß.');config=validateWorkspaces(JSON.parse(await file.text()));siteIndex=buttonIndex=0;draw();feedback('Webseiten geladen. Prüfen und speichern.');})().catch(e=>feedback(e.message));};
async function updateStatus(){const result=await message({type:'workspaces:get'});el('web-status').textContent=result.status?.message??'Noch nicht verbunden. Mit Stream Deck koppeln oder Verbindung prüfen.';}
chrome.storage.onChanged.addListener((_c,area)=>{if(area==='session')void updateStatus().catch(()=>{});});
const initial=await message({type:'workspaces:get'});config=validateWorkspaces(initial.config);draw();await message({type:'refresh'});await updateStatus();
