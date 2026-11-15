export type KiwiAPI={setShopID:(shop:string)=>void;setLanguage:(language:string)=>void;loadSizing:(request:{productData:Record<string,unknown>;options:Record<string,unknown>;loaded?:(success:boolean)=>void})=>void};
declare global {interface Window {ks?:KiwiAPI}}

// A failed download must not leave every subsequent product sharing a pending
// promise. Keep concurrent callers together, but allow a fresh attempt on error.
export function createKiwiLoader(getWindow:()=>Window,getDocument:()=>Document,timeout=10000){
 let pending:Promise<KiwiAPI>|undefined;
 return function loadKiwi():Promise<KiwiAPI>{
  const win=getWindow();
  if(win.ks?.loadSizing)return Promise.resolve(win.ks);
  if(pending)return pending;
  const request=new Promise<KiwiAPI>((resolve,reject)=>{
   const script=getDocument().createElement('script');script.async=true;script.fetchPriority='low';
   script.src='https://cdn.static.kiwisizing.com/SizingPlugin.prod.js';script.id='equator-kiwi-sdk';
   const fail=()=>{clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();reject(new Error('Kiwi could not load'));};
   const timer=setTimeout(fail,timeout);
   script.onerror=fail;
   script.onload=()=>{if(win.ks?.loadSizing){clearTimeout(timer);resolve(win.ks);}else fail();};
   getDocument().head.append(script);
  });
  pending=request;
  void request.catch(()=>{if(pending===request)pending=undefined;});
  return request;
 };
}
