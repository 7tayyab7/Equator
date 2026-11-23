import {requestStorefront} from './storefront.server.ts';
import {pairedProducts,pairingType,type PairingSource} from './product-pairing.ts';
import {complementaryTypes} from './product-helpers.ts';
import type {CardNode} from './product.server';
type Page={nodes:CardNode[];pageInfo:{hasNextPage:boolean;endCursor:string|null}};
type Entry<T>={expires:number;value:T};
/** Cache completed public metadata, never request-owned Oxygen I/O. */
export function createPairingLoader(requester:typeof requestStorefront=requestStorefront){
 const pages=new Map<string,Entry<Page>>(),manual=new Map<string,Entry<CardNode[]>>(),galleries=new Map<string,Entry<CardNode[]>>();
 async function cached<T>(cache:Map<string,Entry<T>>,key:string,load:()=>Promise<T>){
  const old=cache.get(key);if(old&&old.expires>Date.now())return old.value;
  const value=await load();
  cache.delete(key);cache.set(key,{expires:Date.now()+300000,value});if(cache.size>40)cache.delete(cache.keys().next().value!);return value;
 }
 return async function load(env:Record<string,string>,current:PairingSource,fields:string,signal:AbortSignal,excluded:string[]=[],limit=8):Promise<CardNode[]>{
  signal=AbortSignal.any([signal,AbortSignal.timeout(12000)]);
  signal.throwIfAborted();const domain=env.PUBLIC_STORE_DOMAIN,small=fields.replace('images(first:100)','images(first:1)');
  // Start both independent sources together, rather than serially scanning the catalogue.
  const types=complementaryTypes(pairingType(current));
  const words=[...new Set(types.flatMap(type=>type==='Pants'?['pant','pent','trouser','chino']:type==='Shalwar Kameez'?['shalwar','kameez']:type.toLowerCase().split(' ')))];
  const search=`available_for_sale:true AND (${words.map(word=>`(product_type:*${word}* OR title:*${word}*)`).join(' OR ')})`;
  const pageFor=(after:string|null)=>cached(pages,`${domain}:${search}:${after||'newest'}`,async()=>{
   const d=await requester<{products:Page}>(env,`query PairingCandidates($after:String,$search:String!) @inContext(country:PK,language:EN){products(first:100,after:$after,query:$search,sortKey:CREATED_AT,reverse:true){nodes{${small}}pageInfo{hasNextPage endCursor}}}`,{after,search},AbortSignal.any([signal,AbortSignal.timeout(5000)]));return d.products;
  });
  const firstPage=pageFor(null).catch(()=>null);
  const recommended=await cached(manual,`${domain}:${current.id}`,async()=>{
   const d=await requester<{productRecommendations:CardNode[]|null}>(env,`query PairingRecommendations($id:ID!) @inContext(country:PK,language:EN){productRecommendations(productId:$id,intent:COMPLEMENTARY){${small}}}`,{id:current.id},AbortSignal.any([signal,AbortSignal.timeout(5000)]));return d.productRecommendations||[];
  }).catch(()=>[]);
  const candidates=[...recommended];let selected=pairedProducts(current,candidates,excluded,limit),after:string|null=null;
  const cursors=new Set<string>();
  for(let page=0;selected.length<limit&&page<2;page++){
   signal.throwIfAborted();
   const data:Page|null=page===0?await firstPage:await pageFor(after).catch(()=>null);
   // A failed later page must not erase recommendations already found.
   if(!data)break;
   candidates.push(...data.nodes);selected=pairedProducts(current,candidates,excluded,limit);
   const next:string|null=data.pageInfo.endCursor;
   if(!data.pageInfo.hasNextPage||!next||cursors.has(next))break;cursors.add(next);after=next;
  }
  if(!selected.length)return [];
  signal.throwIfAborted();
  // Fetch full media metadata only for chosen cards; file loading remains deferred.
  const ids=selected.map(p=>p.id),key=`${domain}:${[...ids].sort().join(',')}`;
  const full=await cached(galleries,key,async()=>{
   const d=await requester<{nodes:(CardNode|null)[]}>(env,`query PairingGallery($ids:[ID!]!) @inContext(country:PK,language:EN){nodes(ids:$ids){... on Product{${fields}}}}`,{ids},AbortSignal.any([signal,AbortSignal.timeout(5000)]));return d.nodes.filter((p):p is CardNode=>!!p);
  }).catch(()=>selected);
  const byId=new Map(full.map(p=>[p.id,p]));
  return pairedProducts(current,selected.map(product=>byId.get(product.id)||product),excluded,limit);
 };
}
export const getProductPairings=createPairingLoader();
