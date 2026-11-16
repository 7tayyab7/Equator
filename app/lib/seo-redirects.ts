export type UrlRedirect={path:string;target:string};
export function normalizedPath(path:string){try{return new URL(path,'https://equatorstores.com').pathname.replace(/\/+$/,'')||'/';}catch{return path;}}
export function legacyTarget(url:URL){
 const path=url.pathname.replace(/\.data$/,'');if(path.startsWith('//'))return null;
 const product=path.match(/^\/collections\/[^/]+\/products\/([^/]+)\/?$/);
 if(product)return `/products/${product[1]}${url.search}`;
 if(path==='/products')return '/collections/all'+url.search;
 if(/^\/sitemap_(?:products|collections|pages|blogs|articles)_\d+\.xml$/.test(path))return '/sitemap.xml';
 if(path.length>1&&path.endsWith('/'))return path.replace(/\/+$/,'')+url.search;
 return null;
}
export function resolveShopifyRedirect(url:URL,rows:UrlRedirect[]){
 const map=new Map(rows.map(row=>[normalizedPath(row.path),row.target]));
 const start=normalizedPath(url.pathname.replace(/\.data$/,''));let carried=new URLSearchParams(url.search);let current=start,target:string|undefined,found=false;const seen=new Set<string>();
 for(let depth=0;depth<20;depth++){
  if(seen.has(current))return null;seen.add(current);target=map.get(current);if(!target)break;found=true;
  let next:URL;try{next=new URL(target,url.origin);}catch{return null;}if(!['http:','https:'].includes(next.protocol))return null;
  const legacyShopping=next.hostname==='checkout.equatorstores.com'&&/^\/(?:products|collections|pages|policies|blogs)(?:\/|$)/.test(next.pathname);
  if(!legacyShopping&&!['equatorstores.com','www.equatorstores.com','equatorstores.myshopify.com',url.hostname].includes(next.hostname))return next.href;
  for(const [key,value] of carried)if(!next.searchParams.has(key))next.searchParams.append(key,value);carried=next.searchParams;
  current=normalizedPath(next.pathname);
  if(!map.has(current)){
   for(const [key,value] of url.searchParams)if(!next.searchParams.has(key))next.searchParams.append(key,value);
   return current+next.search+next.hash;
  }
 }
 return found&&current!==start?current:null;
}
