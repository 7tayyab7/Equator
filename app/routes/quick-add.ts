import type {Route} from './+types/quick-add';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import type {Variant} from '../lib/product-helpers';
export async function loader({request,context}:Route.LoaderArgs){
 const handle=new URL(request.url).searchParams.get('handle')||'';
 if(!/^[a-z0-9-]{1,255}$/.test(handle))return Response.json({error:'Product unavailable.'},{status:400});
 try{
  const data=await requestStorefront<{product:{variants:{nodes:Variant[];pageInfo:{hasNextPage:boolean;endCursor:string}}}|null}>(context.get(environmentContext),`query QuickAdd($handle:String!,$after:String) @inContext(country:PK){product(handle:$handle){variants(first:250,after:$after){nodes{id title availableForSale selectedOptions{name value} price{amount currencyCode}} pageInfo{hasNextPage endCursor}}}}`,{handle},request.signal);
  if(!data.product)return Response.json({error:'Product unavailable.'},{status:404});
  const variants=[...data.product.variants.nodes];let page=data.product.variants.pageInfo;
  while(page.hasNextPage){const next=await requestStorefront<typeof data>(context.get(environmentContext),`query QuickAddMore($handle:String!,$after:String) @inContext(country:PK){product(handle:$handle){variants(first:250,after:$after){nodes{id title availableForSale selectedOptions{name value} price{amount currencyCode}} pageInfo{hasNextPage endCursor}}}}`,{handle,after:page.endCursor},request.signal);if(!next.product||next.product.variants.pageInfo.endCursor===page.endCursor)throw new Error('Incomplete variants');variants.push(...next.product.variants.nodes);page=next.product.variants.pageInfo;}
  return Response.json({variants},{headers:{'Cache-Control':'public, max-age=30'}});
 }catch{return Response.json({error:'Sizes could not be loaded. Please try again.'},{status:503});}
}
