import {createShopifyRequestContext, createStorefrontClient,handleShopifyRoutes} from '@shopify/hydrogen';
import {inheritQueryRuntime} from './lib/query-runtime.server';
import {storefrontContext, environmentContext} from './storefront.context';
import type {Route} from './+types/root';

export const storefrontMiddleware: Route.MiddlewareFunction = async ({request, context}, next) => {
  const env:Record<string,string> = {
    PUBLIC_STORE_DOMAIN: '',
    PUBLIC_STOREFRONT_API_TOKEN: '',
    ...context.get(environmentContext),
  };
  inheritQueryRuntime(env,context.get(environmentContext));
  context.set(environmentContext, env);
  const requestContext = createShopifyRequestContext({request, i18n: {country: 'PK', language: 'EN'}});
  // Oxygen bindings take precedence over server-only local environment values.
  // Without credentials, content readers use the preview defaults.
  const client = createStorefrontClient({
    type: 'public', requestContext,
    config: {storeDomain: env.PUBLIC_STORE_DOMAIN || 'mock.shop', publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN || undefined,storefrontId:env.PUBLIC_STOREFRONT_ID||'1000182782'},
  });
  context.set(storefrontContext, client);
  const pathname=new URL(request.url).pathname;
  if(/^\/api\/(?:unstable|2\d{3}-\d{2})\/graphql\.json$/.test(pathname)||pathname.startsWith('/__shopify/')){
    if(request.method!=='POST'||request.headers.get('Origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403,headers:{'X-Robots-Tag':'noindex, nofollow'}});
    const response=await handleShopifyRoutes({request,requestContext,storefrontClient:client,sessionManager:{getSessionOrigin:()=>new URL(request.url).origin,getSessionItem:()=>undefined,setSessionItem:()=>{},removeSessionItem:()=>{}}});
    if(response){response.headers.set('X-Robots-Tag','noindex, nofollow');return response;}
  }
  const response = await next();
  requestContext.applyResponseHeaders(response.headers);
  return response;
};
