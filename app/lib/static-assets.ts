/**
 * The storefront's own images, icons and font live in app/static and are bundled like the scripts, so in production
 * they are served from Shopify's CDN (cdn.shopify.com) instead of from equatorstores.com.
 *
 * Why: files in public/ were answered by Oxygen's static file layer on equatorstores.com itself. From the CDN they are
 * cached long-term and served from Shopify's file network. (The first-visit 29 s HTTP/3 stall was fixed in DNS instead:
 * the apex A record points to 23.227.38.69, because sessions to 23.227.38.65 went silent.)
 *
 * Old addresses such as /images/settings-logo.png keep working: server.ts answers them with a permanent redirect to
 * the CDN copy (staticRedirect), so search engines, social previews and old links are unaffected.
 */
let files:Record<string,string>={};
// Vite replaces this call with the file → URL map at build time. Outside Vite (unit tests) it does not exist.
try{files=import.meta.glob('../static/**/*',{query:'?url',import:'default',eager:true}) as Record<string,string>;}catch{files={};}
export const STATIC_ASSETS:Record<string,string>=Object.fromEntries(Object.entries(files).map(([file,url])=>[file.replace(/^\.\.\/static/,''),url]));

/** CDN address for a site file path like "/images/payments/visa.svg" (query string kept); any other value is returned unchanged. */
export function staticAsset(path:string):string{
  if(!path.startsWith('/'))return path;
  const [file,query]=path.split('?');const url=STATIC_ASSETS[file];
  return url?(query?`${url}${url.includes('?')?'&':'?'}${query}`:url):path;
}

/** For a request to an old site file address: where it lives now, or null. */
export function staticRedirect(pathname:string):string|null{
  const url=STATIC_ASSETS[pathname];return url&&url!==pathname?url:null;
}
