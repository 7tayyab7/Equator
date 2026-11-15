import {colorLabel,colorProductHandles} from './product-helpers';
import {requestStorefront} from './storefront.server';

export type CardColor={handle:string;title:string;image:{url:string;width:number;height:number}};
type ColorNode={handle:string;title:string;descriptionHtml:string;images:{nodes:CardColor['image'][]}};
const cache=new Map<string,{expires:number;colors:CardColor[]}>();

/** Resolve real products using the live theme's numbered-handle rule, never title guesses. */
export async function getCardColors(env:Record<string,string>,handles:string[],signal:AbortSignal) {
 const families=new Map(handles.map(handle=>{const candidates=colorProductHandles(handle);return [candidates[0],candidates] as const;}));
 const results:Record<string,CardColor[]>={},missing=new Map<string,readonly string[]>();
 for(const [family,candidates] of families){const hit=cache.get(`${env.PUBLIC_STORE_DOMAIN}:${family}`);if(hit&&hit.expires>Date.now())results[family]=hit.colors;else missing.set(family,candidates);}
 if(missing.size){
  const candidates=[...new Set([...missing.values()].flat())];
  const data=await requestStorefront<Record<string,ColorNode|null>>(env,`query CardColorProducts(${candidates.map((_,i)=>`$h${i}:String!`).join(',')}) @inContext(country:PK,language:EN){${candidates.map((_,i)=>`p${i}:product(handle:$h${i}){handle title descriptionHtml images(first:1){nodes{url width height}}}`).join(' ')}}`,Object.fromEntries(candidates.map((h,i)=>[`h${i}`,h])),signal);
  const products=new Map(Object.values(data).filter((p):p is ColorNode=>!!p).map(p=>[p.handle,p]));
  for(const [family,members] of missing){const colors=members.flatMap(handle=>{const p=products.get(handle),image=p?.images.nodes[0];return p&&image?[{handle,title:colorLabel(p.descriptionHtml,p.title),image}]:[];});results[family]=colors;
   if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(`${env.PUBLIC_STORE_DOMAIN}:${family}`,{expires:Date.now()+300_000,colors});}
 }
 return Object.fromEntries(handles.map(handle=>[handle,results[colorProductHandles(handle)[0]]||[]]));
}
