/**
 * Shopify's own pages (checkout hand-offs, classic accounts, contact/newsletter forms, theme data) are reached on the
 * store's permanent myshopify address. It works whichever domain is primary, so making equatorstores.com the primary
 * domain (so catalog/ad links open the real product) cannot break these links or send them in a loop.
 */
export const HOSTED_STORE_ORIGIN='https://equatorstores.myshopify.com';
export function hostedStoreOrigin(_env?:Record<string,string>){return HOSTED_STORE_ORIGIN;}
/** Preserve saved checkout links and Shopify app/form endpoints that arrive on a Hydrogen domain. */
export function hostedHandoff(request:Request,env:Record<string,string>){
 const url=new URL(request.url),origin=hostedStoreOrigin(env);
 if(/^\/admin(?:\/|$)/.test(url.pathname))return 'https://admin.shopify.com/store/equatorstores'+url.pathname.slice('/admin'.length)+url.search;
 if(url.origin===origin)return null;
 const native=/^\/(?:checkouts?)(?:\/|$)|^\/cart\/c(?:\/|$)|^\/account\/.+|^\/(?:apps|tools|wallets|digital_wallets|challenge)(?:\/|$)/.test(url.pathname);
 if(!native&&!(url.pathname==='/contact'&&request.method==='POST'))return null;
 return origin+url.pathname+url.search;
}
