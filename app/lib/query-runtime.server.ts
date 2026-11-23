import {Cache,createFetchWithCache,type CacheInstance} from '@shopify/hydrogen';
type Metric={name:string;ms:number;cache:string};
type Runtime={cache?:CacheInstance;waitUntil:(promise:Promise<unknown>)=>void;metrics:Metric[];path:string;cacheEnabled:boolean};
const runtimes=new WeakMap<object,Runtime>();
export function bindQueryRuntime(env:object,runtime:Runtime){runtimes.set(env,runtime);}
export function inheritQueryRuntime(env:object,previous:object){const runtime=runtimes.get(previous);if(runtime)bindQueryRuntime(env,runtime);}
export function queryStrategy(name:string){if(/^(RedesignNavigation|HomepageSettings)$/.test(name))return Cache.long({maxAge:300,staleWhileRevalidate:3600});if(/^(ProductDetail|MoreVariants|ProductExtras|HomepageMerchandising|Collection\w+|AllProduct\w+|Pairing\w+)$/.test(name))return Cache.short();return null;}
export async function queryFetch(env:Record<string,string>,query:string,variables:Record<string,unknown>,url:string,init:RequestInit){
 const runtime=runtimes.get(env),name=query.match(/\bquery\s+(\w+)/)?.[1]||'Anonymous',started=performance.now();let cache='bypass';
 try{
  const strategy=queryStrategy(name),response=runtime?.cache&&runtime.cacheEnabled&&strategy?await createFetchWithCache({cache:runtime.cache,waitUntil:runtime.waitUntil})(url,init,{key:['equator-public-v1',env.PUBLIC_STORE_DOMAIN,'PK','EN',query,JSON.stringify(variables)],strategy,backgroundSignal:()=>AbortSignal.timeout(10000),shouldCacheResponse:async response=>{try{const body=JSON.parse(await response.text());return !body.errors?.length&&!!body.data;}catch{return false;}}}):await fetch(url,init);
  cache=response.headers.get('Cache-Status')||'bypass';
  // Include JSON decoding in the measured query; return a fresh body to readers.
  const bytes=await response.arrayBuffer();
  return new Response(bytes,response);
 }finally{const metric={name,ms:Math.round(performance.now()-started),cache};runtime?.metrics.push(metric);console.info('Equator Storefront query',{path:runtime?.path||'resource',...metric});}
}
export function queryTimingHeader(metrics:Metric[]){return metrics.map((m,i)=>`sf_${m.name}_${i};dur=${m.ms};desc="${m.cache.replace(/[^\w=; -]/g,'').slice(0,100)}"`).join(', ');}
