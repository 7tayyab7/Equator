import type {Variant} from './product-helpers';

// Short-lived, bounded intent cache. Shopify still validates every cart mutation.
export function createQuickAddLoader(fetcher:typeof fetch=fetch,now:()=>number=Date.now){
 const entries=new Map<string,{expires:number;variants?:Variant[];pending:Promise<Variant[]>}>();
 function read(handle:string){const entry=entries.get(handle);return entry&&entry.expires>now()?entry.variants:undefined;}
 function load(handle:string):Promise<Variant[]>{
  const current=entries.get(handle);if(current&&current.expires>now())return current.pending;
  const entry={expires:now()+30000,variants:undefined as Variant[]|undefined,pending:undefined as unknown as Promise<Variant[]>};
  entry.pending=fetcher(`/resources/quick-add?${new URLSearchParams({handle})}`,{signal:AbortSignal.timeout(10000)}).then(async response=>{
   const data=await response.json() as {variants?:Variant[];error?:string};
   if(!response.ok||!Array.isArray(data.variants))throw new Error(data.error||'Sizes unavailable.');
   entry.variants=data.variants;entry.expires=now()+30000;return data.variants;
  }).catch(error=>{if(entries.get(handle)===entry)entries.delete(handle);throw error;});
  entries.delete(handle);entries.set(handle,entry);
  if(entries.size>40)entries.delete(entries.keys().next().value!);
  return entry.pending;
 }
 return {read,load,invalidate:(handle:string)=>entries.delete(handle)};
}
export const quickAddLoader=createQuickAddLoader();
export function warmQuickAdd(handle:string){void quickAddLoader.load(handle).catch(()=>{/* Opening the dialog offers a retry. */});}
