/** Shopify-hosted forms/accounts stay on the Online Store target after Hydrogen takes the apex. */
export function hostedStoreOrigin(env:Record<string,string>){
 const domain=env.PUBLIC_CHECKOUT_DOMAIN?.trim().toLowerCase().replace(/^https:\/\//,'').replace(/\/$/,'');
 return domain&&/^([a-z0-9-]+\.)+equatorstores\.com$/.test(domain)?`https://${domain}`:'https://equatorstores.myshopify.com';
}
/** Preserve saved checkout links and Shopify app/form endpoints when the apex moves to Hydrogen. */
export function hostedHandoff(request:Request,env:Record<string,string>){
 const url=new URL(request.url),origin=hostedStoreOrigin(env);
 if(/^\/admin(?:\/|$)/.test(url.pathname))return 'https://admin.shopify.com/store/equatorstores'+url.pathname.slice('/admin'.length)+url.search;
 if(url.origin===origin)return null;
 const native=/^\/(?:checkouts?)(?:\/|$)|^\/cart\/c(?:\/|$)|^\/account\/.+|^\/(?:apps|tools|wallets|digital_wallets|challenge)(?:\/|$)/.test(url.pathname);
 if(!native&&!(url.pathname==='/contact'&&request.method==='POST'))return null;
 return origin+url.pathname+url.search;
}
