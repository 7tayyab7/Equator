import snapshot from '../content/products.json';
import {requestStorefront} from './storefront.server';
import {cardFields,toCard,type CardNode} from './product.server';
export type ProductImage={url:string;width:number;height:number;alt:string};
export type ProductCardData={id:string;title:string;handle:string;price:number;compareAtPrice?:number;currency:string;priceVaries:boolean;images:ProductImage[];available?:boolean};
const cached=new Map<string,{expires:number;products:ProductCardData[]}>();
export async function getProducts(collection:string,limit:number,env:Record<string,string>,signal:AbortSignal) {
  const handle=/^[a-z0-9-]+$/.test(collection)?collection:'best-selling';
  const key=`${env.PUBLIC_STORE_DOMAIN}:${handle}:${limit}`,hit=cached.get(key);
  if(hit&&hit.expires>Date.now())return {products:hit.products,source:'live'};
  if(env.PUBLIC_STORE_DOMAIN&&env.PUBLIC_STOREFRONT_API_TOKEN) {
    try {
      const data=await requestStorefront<{collection:{products:{nodes:CardNode[]}}|null}>(env,`query HomepageProducts($handle:String!,$limit:Int!) @inContext(country:PK,language:EN){collection(handle:$handle){products(first:$limit,sortKey:BEST_SELLING){nodes{${cardFields}}}}}`,{handle,limit},signal);
      const products=data.collection?.products.nodes.filter(product=>product.images.nodes.length).map(toCard);
      if(products?.length){cached.set(key,{expires:Date.now()+60_000,products});return {products,source:'live'};}
    } catch(error) {if(signal.aborted)throw error;}
  }
  return {products:env.PUBLIC_STORE_DOMAIN?[]:(snapshot as ProductCardData[]).slice(0,limit),source:env.PUBLIC_STORE_DOMAIN?'unavailable':'snapshot'};
}
