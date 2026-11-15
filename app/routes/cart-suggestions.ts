import type {Route} from './+types/cart-suggestions';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import {cardFields,toCard,type CardNode} from '../lib/product.server';
import {getProductPairings} from '../lib/pairing.server';
import type {PairingSource} from '../lib/product-pairing';
export async function loader({request,context}:Route.LoaderArgs){
 const handles=[...new Set((new URL(request.url).searchParams.get('handles')||'').split(','))].filter(h=>/^[a-z0-9-]{1,255}$/.test(h)).slice(0,20);
 if(!handles.length)return Response.json({products:[]});
 try{
  const env=context.get(environmentContext),source=await requestStorefront<Record<string,PairingSource|null>>(env,`query BagProducts(${handles.map((_,i)=>`$p${i}:String!`).join(',')}) @inContext(country:PK,language:EN){${handles.map((_,i)=>`p${i}:product(handle:$p${i}){id handle title productType}`).join(' ')}}`,Object.fromEntries(handles.map((h,i)=>[`p${i}`,h])),request.signal);
  const products=Object.values(source).filter((p):p is PairingSource=>!!p),excluded=products.map(p=>p.id);
  // Bound work for large bags; every displayed item still comes from a bag product's PDP pairing.
  const pools=await Promise.all(products.slice(0,3).map(current=>getProductPairings(env,current,cardFields,request.signal,excluded,2).catch(()=>[] as CardNode[])));
  const seen=new Set(excluded),suggestions:CardNode[]=[];
  for(let i=0;i<8&&suggestions.length<2;i++)for(const pool of pools){const p=pool[i];if(p&&!seen.has(p.id)){seen.add(p.id);suggestions.push(p);}if(suggestions.length===2)break;}
  return Response.json({products:suggestions.map(toCard)},{headers:{'Cache-Control':'public, max-age=60'}});
 }catch{return Response.json({products:[]});}
}
