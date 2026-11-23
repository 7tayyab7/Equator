import {hostedStoreOrigin} from './hosted-store.ts';
const sorts:Record<string,string>={manual:'featured','best-selling':'best-selling','price-ascending':'price-ascending','price-descending':'price-descending','title-ascending':'title-ascending','title-descending':'title-descending','created-ascending':'created-ascending','created-descending':'created-descending'};
export function backendCollectionSort(value:unknown){return typeof value==='string'?sorts[value]||'collection-default':'collection-default';}
/** Liquid exposes the label; product order itself always comes from Storefront COLLECTION_DEFAULT. */
export async function getCollectionDefaultSort(env:Record<string,string>,handle:string,signal:AbortSignal){
 try{const response=await fetch(`${hostedStoreOrigin(env)}/collections/${encodeURIComponent(handle)}?view=hydrogen-sort`,{signal:AbortSignal.any([signal,AbortSignal.timeout(2500)]),redirect:'follow'});if(!response.ok)return 'collection-default';const value=await response.json() as {handle?:string;defaultSort?:unknown};return value.handle===handle?backendCollectionSort(value.defaultSort):'collection-default';}
 catch{return 'collection-default';}
}
