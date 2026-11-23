/**
 * Holds back third-party tracking scripts (Google tag, Meta, TikTok, Snapchat, GTM) until the
 * storefront has finished loading, so on slow or lossy connections they never compete with
 * Equator's own HTML, scripts and images for the first seconds of a visit.
 *
 * Nothing is lost while waiting: each vendor's queue (dataLayer, fbq, ttq, snaptr) is created
 * immediately and records events; only the vendor's network script is delayed. The gate opens at
 * the EARLIEST of:
 *   1. the page has fully loaded and the browser is idle,
 *   2. the visitor first interacts (tap, click, key, scroll), or
 *   3. a safety cap (maxWaitMs) after the gate was created, so slow pages still report.
 * After a tap or the safety cap the scripts still wait for the browser's next idle moment (at most
 * interactionIdleMs), so the page the visitor just tapped renders before vendor code runs.
 */
export type GateEnvironment={
 /** document.readyState at creation time. */
 readyState:string;
 onLoad:(callback:()=>void)=>void;
 /** Registers one-time interaction listeners; returns a function that removes them. */
 onInteraction:(callback:()=>void)=>()=>void;
 /** requestIdleCallback when available, otherwise a short timeout. */
 idle:(callback:()=>void,timeoutMs:number)=>void;
 setTimer:(callback:()=>void,ms:number)=>void;
 /** True while the shopper is moving to another page: vendor scripts wait until the new page is showing. */
 busy?:()=>boolean;
 now:()=>number;
};
export type GateOptions={idleTimeoutMs?:number;maxWaitMs?:number;interactionIdleMs?:number;staggerMs?:number};
export type ThirdPartyGate={run:(task:()=>void)=>void;isOpen:()=>boolean;openedAt:()=>number|undefined;reason:()=>string|undefined};

export function createThirdPartyGate(environment:GateEnvironment|null,options:GateOptions={}):ThirdPartyGate{
 const queue:(()=>void)[]=[];let open=environment===null,openedAt:number|undefined,reason:string|undefined=open?'no-browser-page':undefined;
 let removeInteraction:(()=>void)|undefined,draining=false;
 // Vendor scripts start one at a time, each in its own quiet moment and never while a page change is in progress,
 // so a tap waits for at most one script's start-up instead of all of them back to back. Every task still runs.
 function drain(){
  if(!queue.length){draining=false;return;}draining=true;
  if(environment?.busy?.()){environment.setTimer(drain,300);return;}
  const task=queue.shift()!;try{task();}catch{/* One vendor failing must never block the others or the page. */}
  if(!queue.length){draining=false;return;}
  if(environment)environment.idle(drain,options.staggerMs??2000);else drain();
 }
 function flush(why:string){
  if(open)return;open=true;reason=why;openedAt=environment?.now();removeInteraction?.();
  drain();
 }
 if(environment&&!open){
  const idleTimeoutMs=options.idleTimeoutMs??4000,maxWaitMs=options.maxWaitMs??5000,interactionIdleMs=options.interactionIdleMs??4000;
  let waiting=false;const soon=(why:string)=>{if(open||waiting)return;waiting=true;environment.idle(()=>flush(why),interactionIdleMs);};
  const whenLoaded=()=>environment.idle(()=>flush('page-loaded-and-idle'),idleTimeoutMs);
  if(environment.readyState==='complete')whenLoaded();else environment.onLoad(whenLoaded);
  removeInteraction=environment.onInteraction(()=>soon('visitor-interaction'));
  environment.setTimer(()=>soon('safety-cap'),maxWaitMs);
 }
 return {
  run(task){queue.push(task);if(open&&!draining)drain();},
  isOpen:()=>open,openedAt:()=>openedAt,reason:()=>reason,
 };
}

/** The real browser environment, or null outside a browser page (server rendering, unit tests). */
export function browserGateEnvironment():GateEnvironment|null{
 if(typeof window==='undefined'||typeof document==='undefined'||typeof document.readyState!=='string'||typeof window.addEventListener!=='function')return null;
 const interactions=['pointerdown','keydown','touchstart','scroll'] as const;
 return {
  busy:()=>!!(window as Window&{__equatorNavigating?:boolean}).__equatorNavigating,
  readyState:document.readyState,
  onLoad:callback=>window.addEventListener('load',()=>callback(),{once:true}),
  onInteraction(callback){const handler=()=>callback();for(const name of interactions)window.addEventListener(name,handler,{once:true,passive:true});return()=>{for(const name of interactions)window.removeEventListener(name,handler);};},
  idle:(callback,timeoutMs)=>typeof window.requestIdleCallback==='function'?void window.requestIdleCallback(()=>callback(),{timeout:timeoutMs}):void window.setTimeout(callback,Math.min(timeoutMs,300)),
  setTimer:(callback,ms)=>void window.setTimeout(callback,ms),
  now:()=>Math.round(performance.now()),
 };
}
