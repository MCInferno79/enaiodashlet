import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleFor } from './helpers.mjs';
const {validateWorkspaces,websiteFor,originsFor,EMPTY_WORKSPACES}=await moduleFor('shared/workspaces');
const site={id:'portal',name:'Portal',pattern:'portal.example.org/tasks',priority:10,enabled:true,buttons:[{slot:1,label:'Suchen',steps:[{type:'fill',target:'#query',value:'Beispiel'},{type:'click',target:'#search',value:''}]}]};
const valid={version:1,websites:[site]};
test('Webseitenstart ist neutral; beliebige Sites, Tasten und Schrittfolgen sind speicherbar',()=>{
 assert.deepEqual(validateWorkspaces(EMPTY_WORKSPACES),EMPTY_WORKSPACES);
 assert.deepEqual(validateWorkspaces(valid),valid);
 const actions=['text','hotkey','scroll','open'].map((type,i)=>({slot:i+2,label:type,steps:[{type,target:'',value:({text:'Hallo\nWelt',hotkey:'Control+Shift+k',scroll:'-600',open:'https://example.org/'})[type]}]}));
 assert.equal(validateWorkspaces({version:1,websites:[{...site,buttons:actions}]}).websites[0].buttons.length,4);
});
test('Domain/Pfad/Priorität bestimmen die Tastenbelegung, keine Titel- oder Teiltextsuche',()=>{
 const config={version:1,websites:[site,{...site,id:'wild',pattern:'*.example.org',priority:0}]};
 assert.equal(websiteFor('https://portal.example.org/tasks/42?q=private',config).id,'portal');
 assert.equal(websiteFor('https://portal.example.org/tasks-evil',config).id,'wild');
 assert.equal(websiteFor('https://portal.example.org.evil.invalid/tasks',config),undefined);
 assert.equal(websiteFor('edge://settings',config),undefined);
 assert.deepEqual(originsFor('portal.example.org/tasks'),['http://portal.example.org/*','https://portal.example.org/*']);
});
test('Doppelte Tastennummern, ausführbare URLs, ungültige Schritte und unbegrenzte Eingaben werden abgelehnt',()=>{
 for(const buttons of [[site.buttons[0],site.buttons[0]],[{...site.buttons[0],slot:33}],[{...site.buttons[0],label:'x\nsecret'}],[{...site.buttons[0],steps:[]}],[{...site.buttons[0],steps:[{type:'script',target:'',value:'alert(1)'}]}],[{...site.buttons[0],steps:[{type:'open',target:'',value:'javascript:alert(1)'}]}],[{...site.buttons[0],steps:[{type:'open',target:'',value:'https://example.org/'},{type:'click',target:'#x',value:''}]}],[{...site.buttons[0],steps:[{type:'hotkey',target:'',value:'Control+notAKey'}]}]])assert.throws(()=>validateWorkspaces({version:1,websites:[{...site,buttons}]}));
 assert.throws(()=>validateWorkspaces({...valid,unexpected:true}));
});
