import {requestStorefront} from './storefront.server.ts';
const cache=new Map<string,{expires:number;pending:Promise<Map<string,string>>}>();
/** Article.updatedAt is not exposed; Shopify's sitemap API supplies genuine modification dates. */
export function articleDates(env:Record<string,string>){
 const key=env.PUBLIC_STORE_DOMAIN,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.pending;
 const pending=(async()=>{const dates=new Map<string,string>(),ambiguous=new Set<string>();let page=1,more=true;
 while(more&&page<=100){const data=await requestStorefront<{sitemap:{resources:{hasNextPage:boolean;items:{handle:string;updatedAt:string}[]}}}>(env,`query ArticleDates($page:Int!){sitemap(type:ARTICLE){resources(page:$page){hasNextPage items{handle updatedAt}}}}`,{page},AbortSignal.timeout(5000));for(const row of data.sitemap.resources.items){if(dates.has(row.handle))ambiguous.add(row.handle);dates.set(row.handle,row.updatedAt);}more=data.sitemap.resources.hasNextPage;page++;}
 for(const handle of ambiguous)dates.delete(handle);return dates;
 })();cache.set(key,{expires:Date.now()+600000,pending});pending.catch(()=>{if(cache.get(key)?.pending===pending)cache.delete(key);});return pending;
}
