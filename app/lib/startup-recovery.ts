/** Self-contained because its JavaScript is placed before module imports in the document. */
export function installStartupRecovery(win:Window){
 function recover(){
  if(win.document.documentElement.dataset.equatorReady==='true')return;
  const url=new URL(win.location.href);
  if(!/^\/$|^\/(?:products|collections|pages|policies|blogs)(?:\/[a-z0-9-]+){0,2}\/?$|^\/search\/?$/.test(url.pathname))return;
  let hash=2166136261;for(const c of url.pathname+url.search)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  const key='equator-startup-recovery-v1:'+String(hash>>>0),now=Date.now();
  try{const value=win.sessionStorage.getItem(key);if(value!==null&&now-Number(value)<90000)return;win.sessionStorage.setItem(key,String(now));}catch{return;}
  win.location.replace(url.href);
 }
 win.addEventListener('error',event=>{
  const target=event.target as HTMLScriptElement|HTMLLinkElement|null;
  const path=target&&('src' in target?target.src:'href' in target?target.href:'');
  if(path){try{const url=new URL(path,win.location.href);if(url.origin===win.location.origin&&url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.js'))recover();}catch{}}
 },true);
 win.addEventListener('vite:preloadError',event=>{if(String((event as Event&{payload?:Error}).payload?.message||'').includes(win.location.origin+'/assets/'))recover();});
 win.addEventListener('unhandledrejection',event=>{const message=String(event.reason?.message||event.reason||'');if(message.includes(win.location.origin+'/assets/')&&/Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .+ failed/i.test(message))recover();});
 // A restored history page must not bring back an old modal's invisible top layer.
 win.addEventListener('pageshow',event=>{if(event.persisted)win.document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>dialog.close());});
}
