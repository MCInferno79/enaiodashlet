import { isKey, parsePattern, matchRule } from './config';
export type Step = { type: 'click' | 'fill' | 'text' | 'hotkey' | 'scroll' | 'open'; target: string; value: string };
export type WebButton = { slot: number; label: string; steps: Step[] };
export type Website = { id: string; name: string; pattern: string; priority: number; enabled: boolean; buttons: WebButton[] };
export type Workspaces = { version: 1; websites: Website[] };
export const EMPTY_WORKSPACES: Workspaces = { version: 1, websites: [] };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max && !/[\u0000-\u0008\u000b-\u001f]/.test(v);
export function validateWorkspaces(value: unknown): Workspaces {
  if (!object(value) || Object.keys(value).some(k => !['version','websites'].includes(k)) || value.version !== 1 || !Array.isArray(value.websites) || value.websites.length > 100) throw new Error('Ungültige Webseiten-Konfiguration (maximal 100 Webseiten).');
  const ids = new Set<string>();
  const websites = value.websites.map(site => {
    if (!object(site) || Object.keys(site).some(k => !['id','name','pattern','priority','enabled','buttons'].includes(k)) || !isKey(site.id) || ids.has(site.id) || !text(site.name,100) || !site.name.trim() || !text(site.pattern,1024) || typeof site.enabled !== 'boolean' || !Number.isInteger(site.priority) || Math.abs(Number(site.priority)) > 10000 || !Array.isArray(site.buttons) || site.buttons.length > 32) throw new Error('Webseite, Muster oder Tastenbelegung ungültig.');
    ids.add(site.id); parsePattern(site.pattern); const slots = new Set<number>();
    const buttons = site.buttons.map(button => {
      if (!object(button) || Object.keys(button).some(k => !['slot','label','steps'].includes(k)) || !Number.isInteger(button.slot) || Number(button.slot)<1 || Number(button.slot)>32 || slots.has(Number(button.slot)) || !text(button.label,50) || !button.label.trim() || /[\r\n\t]/.test(button.label) || !Array.isArray(button.steps) || button.steps.length<1 || button.steps.length>10) throw new Error('Je Webseite sind bis zu 32 eindeutige Tasten mit je 1–10 Schritten möglich.');
      slots.add(Number(button.slot));
      const rawSteps=button.steps;
      const steps = rawSteps.map((step,index) => {
        if (!object(step) || Object.keys(step).some(k => !['type','target','value'].includes(k)) || !['click','fill','text','hotkey','scroll','open'].includes(String(step.type)) || !text(step.target,1000) || !text(step.value,10000)) throw new Error('Aktionsschritt ungültig.');
        if (['click','fill'].includes(String(step.type)) && !step.target.trim()) throw new Error('Für Klicken und Feld ausfüllen ist ein CSS-Selektor erforderlich.');
        if (step.type==='open') { const url=new URL(step.value); if (!['http:','https:'].includes(url.protocol) || url.username || url.password || index !== rawSteps.length-1) throw new Error('Seite öffnen benötigt eine HTTP(S)-Adresse ohne Zugangsdaten und muss der letzte Schritt sein.'); }
        if (step.type==='hotkey' && !/^(?:(?:Control|Alt|Shift|Meta)\+){0,4}(?:[a-zA-Z0-9]|Enter|Escape|Tab|Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Backspace|F(?:[1-9]|1[0-2]))$/.test(step.value)) throw new Error('Seiten-Tastenkürzel zum Beispiel Control+Shift+k oder Enter angeben.');
        if (step.type==='scroll' && (!/^-?\d{1,5}$/.test(step.value) || Math.abs(Number(step.value))>10000)) throw new Error('Scroll-Abstand zwischen -10000 und 10000 Pixeln angeben.');
        return { type:step.type as Step['type'], target:step.target, value:step.value };
      });
      return { slot:Number(button.slot), label:button.label.trim(), steps };
    });
    return { id:site.id, name:site.name.trim(), pattern:site.pattern, priority:Number(site.priority), enabled:site.enabled, buttons };
  });
  if (JSON.stringify(websites).length>500000) throw new Error('Webseiten-Konfiguration ist zu groß.');
  return { version:1, websites };
}
export function websiteFor(url: string, config: Workspaces): Website | undefined {
  const id=matchRule(url,config.websites.map(s=>({id:s.id,name:s.name,pattern:s.pattern,priority:s.priority,enabled:s.enabled,profile:s.id}))).rule?.id;
  return config.websites.find(s=>s.id===id);
}
export function originsFor(pattern: string): string[] {
  const p=parsePattern(pattern), host=(p.wildcard?'*.':'')+p.host;
  return ['http://'+host+'/*','https://'+host+'/*'];
}
