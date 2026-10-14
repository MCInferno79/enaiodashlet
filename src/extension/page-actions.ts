import type { Step } from '../shared/workspaces';
// This function is serialized by chrome.scripting; it has no outside dependencies.
export async function runPageSteps(steps: Step[], expectedUrl: string, expires: number): Promise<{ ok: boolean; error?: string }> {
  try {
    for (const step of steps) {
      if(!Number.isFinite(expires)||Date.now()>expires)return {ok:false,error:'REQUEST_EXPIRED'};
      if(location.href!==expectedUrl||!document.hasFocus())return {ok:false,error:'CONTEXT_CHANGED'};
      const element = step.target ? document.querySelector(step.target) : document.activeElement;
      if (['click','fill','text','hotkey'].includes(step.type) && !(element instanceof HTMLElement)) return {ok:false,error:'ELEMENT_NOT_FOUND'};
      if (element instanceof HTMLElement && ['click','fill','text'].includes(step.type)) {
        const rect=element.getBoundingClientRect(), style=getComputedStyle(element);
        if (!rect.width || !rect.height || style.display==='none' || style.visibility==='hidden' || ('disabled' in element && element.disabled)) return {ok:false,error:'ELEMENT_UNAVAILABLE'};
      }
      if (step.type==='click') (element as HTMLElement).click();
      else if (step.type==='fill' || step.type==='text') {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || element.readOnly || (element instanceof HTMLInputElement && ['password','file','hidden','checkbox','radio','button','submit'].includes(element.type))) return {ok:false,error:'FIELD_UNSUPPORTED'};
        element.focus();
        let value=step.value;
        if(step.type==='text') { const start=element.selectionStart??element.value.length,end=element.selectionEnd??start;value=element.value.slice(0,start)+value+element.value.slice(end); }
        const proto=element instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;
        const previous=element.value, setter=Object.getOwnPropertyDescriptor(proto,'value')!.set!;
        setter.call(element,value);
        if(element.value!==value){setter.call(element,previous);return {ok:false,error:'FIELD_VALUE_REJECTED'};}
        element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:step.value}));
        element.dispatchEvent(new Event('change',{bubbles:true}));
      } else if (step.type==='hotkey') {
        const parts=step.value.split('+'), raw=parts.pop()!,key=raw==='Space'?' ':raw;
        const event={key,code:/^[a-z]$/i.test(raw)?'Key'+raw.toUpperCase():raw,ctrlKey:parts.includes('Control'),altKey:parts.includes('Alt'),shiftKey:parts.includes('Shift'),metaKey:parts.includes('Meta'),bubbles:true,cancelable:true};
        (element as HTMLElement).focus();
        element?.dispatchEvent(new KeyboardEvent('keydown',event));element?.dispatchEvent(new KeyboardEvent('keyup',event));
      } else if (step.type==='scroll') window.scrollBy({top:Number(step.value),behavior:'instant'});
    }
    return {ok:true};
  } catch { return {ok:false,error:'PAGE_ACTION_FAILED'}; }
}
