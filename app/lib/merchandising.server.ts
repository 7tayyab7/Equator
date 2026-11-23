import {requestStorefront} from './storefront.server';
import {cardFields,toCard,type CardNode} from './product.server';
import editorial from '../content/editorial-pages.json';
const cache=new Map<string,{expires:number;value:{newProducts:ReturnType<typeof toCard>[]}}>();
export async function getMerchandising(env:Record<string,string>,signal:AbortSignal){
 const key=env.PUBLIC_STORE_DOMAIN,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 try{const data=await requestStorefront<{arrivals:{products:{nodes:CardNode[]}}|null}>(env,`query HomepageMerchandising @inContext(country:PK,language:EN){arrivals:collection(handle:"new-arrivals"){products(first:24,sortKey:MANUAL){nodes{${cardFields}}}}}`,{},AbortSignal.any([signal,AbortSignal.timeout(2500)]));
 const value={newProducts:(data.arrivals?.products.nodes||[]).filter(p=>p.availableForSale&&p.images.nodes.length).map(toCard)};if(cache.size>=5)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+60000,value});return value;
 }catch(error){if(signal.aborted)throw error;return hit?.value||{newProducts:[]};}
}
export function archiveCampaigns(){return Object.entries(editorial.pages).filter(([handle])=>/-25$/.test(handle)).map(([handle,page])=>{const hero=page.hero as {mobile?:{url:string;width:number;height:number;alt:string};desktop?:{url:string;width:number;height:number;alt:string}};return {handle,title:handle.replace(/-25$/," ’25").replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()),image:hero.mobile||hero.desktop||page.images[0]};});}
