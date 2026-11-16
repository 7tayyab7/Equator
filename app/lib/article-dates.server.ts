import {requestStorefront} from './storefront.server.ts';
const cache=new Map<string,{expires:number;value:Map<string,string>}>();
/** Article.updatedAt is not exposed; Shopify's sitemap API supplies genuine modification dates. */
export async function articleDates(env:Record<string,string>,signal?:AbortSignal){
 const key=env.PUBLIC_STORE_DOMAIN,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 // Never cache in-flight Oxygen I/O from another shopper or crawler request.
 const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(8000)]):AbortSignal.timeout(8000);
 const dates=new Map<string,string>(),ambiguous=new Set<string>();let page=1,more=true;
 while(more&&page<=100){const data=await requestStorefront<{sitemap:{resources:{hasNextPage:boolean;items:{handle:string;updatedAt:string}[]}}}>(env,`query ArticleDates($page:Int!){sitemap(type:ARTICLE){resources(page:$page){hasNextPage items{handle updatedAt}}}}`,{page},bounded);for(const row of data.sitemap.resources.items){if(dates.has(row.handle))ambiguous.add(row.handle);dates.set(row.handle,row.updatedAt);}more=data.sitemap.resources.hasNextPage;page++;}
 if(more)throw new Error('Article date pagination exceeded its limit');
 for(const handle of ambiguous)dates.delete(handle);
 if(cache.size>=5)cache.delete(cache.keys().next().value!);
 cache.set(key,{expires:Date.now()+600000,value:dates});return dates;
}
