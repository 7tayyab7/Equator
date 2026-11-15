import snapshot from '../content/shopify-url-redirects.json';
import {requestStorefront} from './storefront.server';
import {legacyTarget,resolveShopifyRedirect,type UrlRedirect} from './seo-redirects.ts';
const cache=new Map<string,{expires:number;rows:UrlRedirect[]}>();
export async function findSeoRedirect(env:Record<string,string>,request:Request){
 const url=new URL(request.url),legacy=legacyTarget(url);if(legacy)return legacy;
 if(url.pathname.length>1024||/^\/(?:resources|assets|images)\//.test(url.pathname)||/\.[a-z0-9]{1,8}$/i.test(url.pathname.replace(/\.data$/,'')))return null;
 const saved=resolveShopifyRedirect(url,snapshot);if(saved)return saved;
 const path=url.pathname.replace(/\.data$/,''),key=env.PUBLIC_STORE_DOMAIN+path;const hit=cache.get(key);if(hit&&hit.expires>Date.now())return resolveShopifyRedirect(url,hit.rows);
 try{
  const data=await requestStorefront<{urlRedirects:{nodes:UrlRedirect[]}}>(env,`query SeoRedirect($query:String!){urlRedirects(first:10,query:$query){nodes{path target}}}`,{query:`path:${JSON.stringify(path)}`},AbortSignal.any([request.signal,AbortSignal.timeout(2000)]));
  const rows=[...snapshot,...data.urlRedirects.nodes],target=resolveShopifyRedirect(url,rows);cache.set(key,{expires:Date.now()+300000,rows});if(cache.size>100)cache.delete(cache.keys().next().value!);return target;
 }catch{return null;}
}
export async function seoLoader<T>(env:Record<string,string>,request:Request,load:()=>Promise<T>):Promise<T>{
 try{return await load();}catch(error){if(error instanceof Response&&error.status===404){const target=await findSeoRedirect(env,request);if(target)throw new Response(null,{status:301,headers:{Location:target}});}throw error;}
}
