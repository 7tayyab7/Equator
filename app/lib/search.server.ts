import {Cache,createRunWithCache} from '@shopify/hydrogen';
import type {SearchCacheRuntime} from '../storefront.context';
import {requestStorefront} from './storefront.server';
import {cardFields,toCard,type CardNode} from './product.server';
import {parseCollectionState,type CollectionFilter} from './collection-state';
import {collectionFacets,visibleCollectionFacets,collectionPage,collectionMatcher,sortCollection,type IndexedProduct} from './collection-filtering';
import {searchScore} from './search-matching';
type Item=IndexedProduct&{handle:string;description:string;variants:IndexedProduct['variants']&{pageInfo:{hasNextPage:boolean;endCursor:string|null}}};
type Identity=Pick<Item,'id'|'title'|'productType'|'description'|'handle'>&{skus:string[]};
type SkuConnection={nodes:{sku:string|null}[];pageInfo:{hasNextPage:boolean;endCursor:string|null}};
type RawIdentity=Omit<Identity,'skus'>&{variants:SkuConnection};
type Connection={nodes:RawIdentity[];pageInfo:{hasNextPage:boolean;endCursor:string|null}};
let cached:{domain:string;expires:number;products:Identity[];filters:CollectionFilter[]}|undefined;
async function loadIdentityCatalog(env:Record<string,string>,signal:AbortSignal){
 const metadata=await requestStorefront<{search:{productFilters:CollectionFilter[]}}>(env,`query SearchFacets @inContext(country:PK){search(first:1,query:"title:*",types:[PRODUCT]){productFilters{id label type values{id label count input}}}}`,{},signal);
 // These are the backend sources supported by this index. Unreadable metafields stay omitted.
 const filters=metadata.search.productFilters.filter(group=>group.values.every(value=>{try{return Object.keys(JSON.parse(value.input)).every(key=>['available','price','variantOption','category','productType','productVendor','tag'].includes(key));}catch{return false;}}));
 const products:Identity[]=[],seen=new Set<string>();let after:string|null=null;
 do{const data:{products:Connection}=await requestStorefront(env,`query SearchIndex($after:String) @inContext(country:PK){products(first:250,after:$after){nodes{id handle title description productType variants(first:20){nodes{sku}pageInfo{hasNextPage endCursor}}}pageInfo{hasNextPage endCursor}}}`,{after},signal);
  for(const product of data.products.nodes){
   const {variants,...identity}=product,skus=variants.nodes.flatMap(v=>v.sku?[v.sku]:[]);let page=variants.pageInfo;const variantCursors=new Set<string>();
   while(page.hasNextPage){if(!page.endCursor||variantCursors.has(page.endCursor))throw new Error('Repeated SKU cursor');variantCursors.add(page.endCursor);const more=await requestStorefront<{node:{variants:SkuConnection}|null}>(env,`query SearchSkuVariants($id:ID!,$after:String!) @inContext(country:PK){node(id:$id){...on Product{variants(first:250,after:$after){nodes{sku}pageInfo{hasNextPage endCursor}}}}}`,{id:product.id,after:page.endCursor},signal);if(!more.node)throw new Error('SKU product unavailable');skus.push(...more.node.variants.nodes.flatMap(v=>v.sku?[v.sku]:[]));page=more.node.variants.pageInfo;}
   products.push({...identity,skus});
  }
  after=data.products.pageInfo.hasNextPage?data.products.pageInfo.endCursor:null;if(after){if(seen.has(after))throw new Error('Repeated search cursor');seen.add(after);}
 }while(after);
 cached={domain:env.PUBLIC_STORE_DOMAIN,expires:Date.now()+300_000,products,filters};return cached;
}
async function catalog(env:Record<string,string>,signal:AbortSignal,runtime:SearchCacheRuntime|null){
 if(cached?.domain===env.PUBLIC_STORE_DOMAIN&&cached.expires>Date.now())return cached;
 if(!runtime)return loadIdentityCatalog(env,signal);
 const run=createRunWithCache(runtime);
 const result=await run({key:['equator-search-identity-v2-skus',env.PUBLIC_STORE_DOMAIN,'PK','EN'],strategy:Cache({maxAge:300,staleWhileRevalidate:900})},async context=>{const value=await loadIdentityCatalog(env,context?.background?AbortSignal.timeout(45000):signal);return {data:value,shouldCache:true};});
 cached={...result.data,expires:Date.now()+300_000};return cached;
}
const inventoryCache=new Map<string,{expires:number;products:Item[]}>();
async function matchingInventory(env:Record<string,string>,identities:Identity[],signal:AbortSignal){
 if(!identities.length)return [];
 const key=env.PUBLIC_STORE_DOMAIN+':'+identities.map(p=>p.id).join(','),hit=inventoryCache.get(key);if(hit&&hit.expires>Date.now())return hit.products;
 const products:Item[]=[];
 for(let offset=0;offset<identities.length;offset+=150){const data=await requestStorefront<{nodes:(Item|null)[]}>(env,`query SearchInventory($ids:[ID!]!) @inContext(country:PK){nodes(ids:$ids){...on Product{id handle title description productType vendor tags availableForSale createdAt category{id}priceRange{minVariantPrice{amount}}variants(first:20){nodes{availableForSale selectedOptions{name value}price{amount}}pageInfo{hasNextPage endCursor}}}}}`,{ids:identities.slice(offset,offset+150).map(p=>p.id)},signal);products.push(...data.nodes.filter((p):p is Item=>!!p));}
 for(const product of products){while(product.variants.pageInfo.hasNextPage){const previous=product.variants.pageInfo.endCursor;const more=await requestStorefront<{node:{variants:Item['variants']}}>(env,`query MoreSearchVariants($id:ID!,$after:String!){node(id:$id){...on Product{variants(first:250,after:$after){nodes{availableForSale selectedOptions{name value}price{amount}}pageInfo{hasNextPage endCursor}}}}}`,{id:product.id,after:product.variants.pageInfo.endCursor},signal);if(!more.node||more.node.variants.pageInfo.hasNextPage&&more.node.variants.pageInfo.endCursor===previous)throw new Error('Repeated variant cursor');product.variants.nodes.push(...more.node.variants.nodes);product.variants.pageInfo=more.node.variants.pageInfo;}}
 if(inventoryCache.size>=12)inventoryCache.delete(inventoryCache.keys().next().value!);inventoryCache.set(key,{expires:Date.now()+60_000,products});return products;
}
export async function searchProducts(env:Record<string,string>,url:URL,signal:AbortSignal,runtime:SearchCacheRuntime|null=null){
 const q=(url.searchParams.get('q')||'').trim().slice(0,120);
 const empty={q,products:[] as ReturnType<typeof toCard>[],filters:[] as CollectionFilter[],state:parseCollectionState(url.searchParams,[],'featured'),pagination:collectionPage(url.searchParams,0)};
 if(!q)return empty;
 const data=await catalog(env,signal,runtime),state=parseCollectionState(url.searchParams,data.filters,'featured');
 if(state.sort==='best-selling')state.sort='featured';
 const scores=new Map(data.products.map(p=>[p.id,searchScore(p,q)]));
 const identities=data.products.filter(p=>scores.get(p.id)!>0);
 const matching=(await matchingInventory(env,identities,signal)).sort((a,b)=>scores.get(b.id)!-scores.get(a.id)!);
 const baseline=collectionFacets(matching,{selected:[],min:'',max:'',sort:'featured'},data.filters);
 const facets=collectionFacets(matching,state,data.filters);
 const selected=matching.filter(collectionMatcher(state,data.filters));
 const ordered=sortCollection(selected,state.sort),pagination=collectionPage(url.searchParams,ordered.length);
 const ids=ordered.slice(pagination.offset,pagination.offset+24).map(p=>p.id);
 let cards:CardNode[]=[];
 if(ids.length){const result=await requestStorefront<{nodes:(CardNode|null)[]}>(env,`query SearchCards($ids:[ID!]!) @inContext(country:PK){nodes(ids:$ids){...on Product{${cardFields}}}}`,{ids},signal);const byId=new Map(result.nodes.filter((p):p is CardNode=>!!p).map(p=>[p.id,p]));cards=ids.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);}
 return {q,products:cards.map(toCard),state,filters:visibleCollectionFacets(facets,baseline,state.selected),pagination};
}
