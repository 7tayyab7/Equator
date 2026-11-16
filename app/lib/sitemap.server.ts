import {articleDates} from './article-dates.server.ts';
import {requestStorefront} from './storefront.server.ts';
import {seoImage} from './seo.ts';
import {nextPageCursor} from './pagination.ts';
export type SitemapRow={handle:string;updatedAt?:string;image?:{url:string;altText?:string|null}|null;blog?:{handle:string};products?:{nodes:{id:string}[]}};
export const sitemapTypes=['products','collections','pages','blogs','articles'] as const;
export type SitemapKind=typeof sitemapTypes[number];
const hiddenPages=new Set(['login','blog','all-store-locations']);
const cache=new Map<string,{expires:number;value:SitemapRow[]}>();
export const xmlEscape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export async function sitemapRows(env:Record<string,string>,kind:SitemapKind,signal?:AbortSignal){
 const key=env.PUBLIC_STORE_DOMAIN+':'+kind,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000);
 const rows:SitemapRow[]=[];let after:string|null=null;const seen=new Set<string>();
 do{
  const fields=kind==='products'?'handle updatedAt image:featuredImage{url altText}':kind==='articles'?'handle blog{handle} image{url altText}':kind==='blogs'?'handle':kind==='collections'?'handle updatedAt products(first:1){nodes{id}}':'handle updatedAt';
  const data:Record<string,{nodes:SitemapRow[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}>=await requestStorefront<Record<string,{nodes:SitemapRow[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}>>(env,`query SeoSitemap($after:String){${kind}(first:250,after:$after){nodes{${fields}}pageInfo{hasNextPage endCursor}}}`,{after},bounded);
  rows.push(...data[kind].nodes);after=nextPageCursor(data[kind].pageInfo,seen);
 }while(after);
 const dates=kind==='articles'?await articleDates(env,bounded).catch(()=>new Map<string,string>()):null;
 const value=kind==='articles'?rows.map(row=>({...row,updatedAt:dates?.get(row.handle)})):kind==='pages'?rows.filter(row=>!hiddenPages.has(row.handle)):kind==='collections'?rows.filter(row=>row.products?.nodes.length):rows;
 if(cache.size>=25)cache.delete(cache.keys().next().value!);
 cache.set(key,{expires:Date.now()+600000,value});return value;
}
export function sitemapPath(kind:SitemapKind,row:SitemapRow){return kind==='articles'?`/blogs/${encodeURIComponent(row.blog!.handle)}/${encodeURIComponent(row.handle)}`:`/${kind}/${encodeURIComponent(row.handle)}`;}
export function sitemapXML(origin:string,kind:SitemapKind,rows:SitemapRow[],includeHome=false){
 const entries=rows.map(row=>{const image=seoImage(row.image?.url,origin);return `<url><loc>${xmlEscape(origin+sitemapPath(kind,row))}</loc>${row.updatedAt?`<lastmod>${xmlEscape(row.updatedAt)}</lastmod>`:''}${image?`<image:image><image:loc>${xmlEscape(image)}</image:loc>${row.image?.altText?`<image:caption>${xmlEscape(row.image.altText)}</image:caption>`:''}</image:image>`:''}</url>`;});
 if(includeHome)entries.unshift(...['/','/collections','/collections/all','/pages','/pages/archive'].map(path=>`<url><loc>${xmlEscape(origin+path)}</loc></url>`));
 return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.join('')}</urlset>`;
}
export function sitemapIndexXML(origin:string,groups:{kind:SitemapKind;count:number}[]){return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${groups.flatMap(({kind,count})=>Array.from({length:Math.max(1,Math.ceil(count/5000))},(_,i)=>`<sitemap><loc>${xmlEscape(`${origin}/sitemap/${kind}/${i+1}.xml`)}</loc></sitemap>`)).join('')}</sitemapindex>`;}
