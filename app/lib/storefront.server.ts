import type {ShopifyRequestContext} from '@shopify/hydrogen';
import {queryFetch} from './query-runtime.server.ts';
export async function requestStorefront<T>(env:Record<string,string>,query:string,variables:Record<string,unknown>,signal:AbortSignal,requestContext?:ShopifyRequestContext):Promise<T> {
 const domain=env.PUBLIC_STORE_DOMAIN,token=env.PUBLIC_STOREFRONT_API_TOKEN;
 if(!domain||!token)throw new Response('Storefront connection unavailable',{status:503});
 try {
 const headers=new Headers({'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':token});requestContext?.applyStorefrontRequestHeaders(headers);
 const response=await queryFetch(env,query,variables,`https://${domain.replace(/^https?:\/\//,'').replace(/\/$/,'')}/api/2026-10/graphql.json`,{method:'POST',headers,body:JSON.stringify({query,variables}),signal:AbortSignal.any([signal,AbortSignal.timeout(10000)])});
 requestContext?.captureSubrequestHeaders(response.headers);
 const result=await response.json() as {data?:T;errors?:{message:string}[]};
 if(!response.ok||result.errors?.length||!result.data) {console.error('Shopify Storefront request failed',response.status,result.errors?.map(e=>e.message));throw new Error('Storefront unavailable');}
 return result.data;
 }catch(error){if(signal.aborted)throw error;throw new Response('Products are temporarily unavailable. Please try again.',{status:503});}
}
