import {getCollectionDefaultSort} from './collection-default.server';
import {fastCollectionFirstPage,collectionPageSort} from './collection-first-page';
import {cardFields,toCard,type CardNode} from './product.server';
import {requestStorefront} from './storefront.server';
import {parseCollectionState,type CollectionFilter} from './collection-state';
import {filterInput,supportsInput,collectionMatcher,collectionFacets,visibleCollectionFacets,sortCollection,collectionPage,type IndexedProduct,type IndexedVariant} from './collection-filtering';

type Metadata={id:string;handle:string;title:string;description:string;image?:{url:string;altText:string|null}|null;seo:{title:string|null;description:string|null};products:{filters:CollectionFilter[]}};
type PageInfo={hasNextPage:boolean;endCursor:string|null};
type ProductIndex=IndexedProduct&{handle:string}&{variants:{nodes:IndexedVariant[];pageInfo:PageInfo}};
type Catalog={defaultSort:string;synthetic:boolean;manualRank?:Map<string,number>;metadata:Metadata;filters:CollectionFilter[];products:ProductIndex[];bestRank?:Map<string,number>};
const cache=new Map<string,{expires:number;value:Catalog}>();
const firstPages=new Map<string,{expires:number;value:Awaited<ReturnType<typeof loadFirstPage>>}>();
async function loadFirstPage(env:Record<string,string>,handle:string,sort:string,signal:AbortSignal){
 const {key,reverse}=collectionPageSort(sort);
 const data=await requestStorefront<{collection:(Omit<Metadata,'products'>&{products:{nodes:CardNode[];pageInfo:PageInfo}})|null}>(env,`query CollectionFirstPage($handle:String!,$sort:ProductCollectionSortKeys!,$reverse:Boolean!) @inContext(country:PK,language:EN){collection(handle:$handle){id handle title description image{url altText}seo{title description}products(first:24,sortKey:$sort,reverse:$reverse){nodes{${cardFields}}pageInfo{hasNextPage endCursor}}}}`,{handle,sort:key,reverse},signal);
 if(!data.collection)throw new Response('Collection not found',{status:404});
 const {products,...metadata}=data.collection;
 return {metadata,products:products.nodes.map(toCard),hasNextPage:products.pageInfo.hasNextPage};
}
export async function getCollectionFilters(env:Record<string,string>,handle:string,signal:AbortSignal){
 if(!/^[a-z0-9-]{1,255}$/.test(handle))throw new Response('Collection not found',{status:404});
 const {products,filters}=await loadCatalog(env,handle,signal);
 const baseline=collectionFacets(products,{selected:[],min:'',max:'',sort:'collection-default'},filters);
 return visibleCollectionFacets(baseline,baseline,[]);
}
const metadataQuery=`query CollectionFacets($handle:String!) @inContext(country:PK,language:EN){collection(handle:$handle){id handle title description image{url altText} seo{title description}products(first:1){filters{id label type values{id label count input}}}}}`;
function identifiers(filters:CollectionFilter[],keys:string[]){const unique=new Map<string,{namespace:string;key:string}>();for(const group of filters)for(const value of group.values){const input=filterInput(value.input);for(const key of keys){const field=input?.[key] as {namespace:string;key:string}|undefined;if(field)unique.set(`${field.namespace}:${field.key}`,{namespace:field.namespace,key:field.key});}}return [...unique.values()];}
async function loadCatalog(env:Record<string,string>,handle:string,signal:AbortSignal):Promise<Catalog>{
 const key=`${env.PUBLIC_STORE_DOMAIN}:${handle}`,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 const defaultSortPromise=getCollectionDefaultSort(env,handle,signal);
 let metadata=(await requestStorefront<{collection:Metadata|null}>(env,metadataQuery,{handle},signal)).collection;
 if(handle==='all'&&!metadata){
  const global=await requestStorefront<{products:Metadata['products']}>(env,`query AllProductFacets{products(first:1){filters{id label type values{id label count input}}}}`,{},signal);
  metadata={id:'all',handle:'all',title:'All Products',description:'Explore all Equator clothing and accessories.',seo:{title:null,description:null},products:global.products};
 }
 if(!metadata)throw new Response('Collection not found',{status:404});
 const synthetic=metadata.id==='all';
 // Every exposed option comes from Search & Discovery, never scraped product copy.
 const filters=metadata.products.filters.filter(group=>!group.values.some(value=>filterInput(value.input)?.available!==undefined)).map(group=>({...group,values:group.values.filter(value=>supportsInput(filterInput(value.input)))})).filter(group=>group.values.length);
 const productMeta=identifiers(filters,['productMetafield','taxonomyMetafield']),variantMeta=identifiers(filters,['variantMetafield']);
 const inputs=filters.flatMap(group=>group.values.map(value=>filterInput(value.input)));
 const extraFields=[inputs.some(input=>input&&'tag' in input)?'tags':'',inputs.some(input=>input&&'productVendor' in input)?'vendor':''].filter(Boolean).join(' ');
 const productFields=productMeta.length?'metafields(identifiers:$productMeta){namespace key value}':'';
 const variantFields=`availableForSale selectedOptions{name value}price{amount}${variantMeta.length?'metafields(identifiers:$variantMeta){namespace key value}':''}`;
 const metaArguments=[productMeta.length?'$productMeta:[HasMetafieldsIdentifier!]!':'',variantMeta.length?'$variantMeta:[HasMetafieldsIdentifier!]!':''].filter(Boolean);
 const metaVariables={...(productMeta.length?{productMeta}:{}),...(variantMeta.length?{variantMeta}:{})};
 const collectionQuery=`query CollectionAvailabilityIndex($handle:String!,$after:String${metaArguments.length?','+metaArguments.join(','):''}) @inContext(country:PK,language:EN){collection(handle:$handle){products(first:250,after:$after,sortKey:COLLECTION_DEFAULT){nodes{id handle title productType availableForSale priceRange{minVariantPrice{amount}}createdAt ${extraFields} category{id}${productFields}variants(first:20){nodes{${variantFields}}pageInfo{hasNextPage endCursor}}}pageInfo{hasNextPage endCursor}}}}`;
 const query=synthetic?collectionQuery.replace('$handle:String!,','').replace('collection(handle:$handle){','').replace('sortKey:COLLECTION_DEFAULT','sortKey:TITLE').slice(0,-1):collectionQuery;
 const products:ProductIndex[]=[],cursors=new Set<string>();let after:string|null=null;
 do{
  const data:{collection?:{products:{nodes:ProductIndex[];pageInfo:PageInfo}}|null;products?:{nodes:ProductIndex[];pageInfo:PageInfo}}=await requestStorefront(env,query,{handle,after,...metaVariables},signal);
  const connection=synthetic?data.products:data.collection?.products;
  if(!connection)throw new Response('Collection not found',{status:404});
  products.push(...connection.nodes.map(product=>({...product,vendor:product.vendor||'',tags:product.tags||[]})));after=connection.pageInfo.hasNextPage?connection.pageInfo.endCursor:null;
  if(after){if(cursors.has(after))throw new Response('Collection pagination unavailable',{status:503});cursors.add(after);}
 }while(after);
 // Clothing normally has fewer than twenty sizes. Complete larger variant sets too.
 for(const product of products){while(product.variants.pageInfo.hasNextPage){const previous=product.variants.pageInfo.endCursor;const more=await requestStorefront<{node:{variants:ProductIndex['variants']}}>(env,`query RemainingCollectionVariants($id:ID!,$after:String!${variantMeta.length?',$variantMeta:[HasMetafieldsIdentifier!]!':''}) @inContext(country:PK,language:EN){node(id:$id){... on Product{variants(first:250,after:$after){nodes{${variantFields}}pageInfo{hasNextPage endCursor}}}}}`,{id:product.id,after:previous,...(variantMeta.length?{variantMeta}:{})},signal);if(!more.node||more.node.variants.pageInfo.hasNextPage&&more.node.variants.pageInfo.endCursor===previous)throw new Response('Variant availability unavailable',{status:503});product.variants.nodes.push(...more.node.variants.nodes);product.variants.pageInfo=more.node.variants.pageInfo;}}
 const defaultSort=synthetic?'title-ascending':await defaultSortPromise;
 const value={metadata,filters,products,defaultSort,synthetic};if(cache.size>=6)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+60_000,value});return value;
}
async function collectionRank(env:Record<string,string>,handle:string,signal:AbortSignal,sortKey:'MANUAL'|'BEST_SELLING',synthetic:boolean){
 const ids:string[]=[];let after:string|null=null;
 const wrapped=`query CollectionSalesOrder($handle:String!,$after:String){collection(handle:$handle){products(first:250,after:$after,sortKey:${sortKey}){nodes{id}pageInfo{hasNextPage endCursor}}}}`;
 const query=synthetic?wrapped.replace('$handle:String!,','').replace('collection(handle:$handle){','').replace('sortKey:MANUAL','sortKey:ID').slice(0,-1):wrapped;
 do{const data:{collection?:{products:{nodes:{id:string}[];pageInfo:PageInfo}};products?:{nodes:{id:string}[];pageInfo:PageInfo}}=await requestStorefront(env,query,{handle,after},signal);const connection=synthetic?data.products:data.collection?.products;if(!connection)break;ids.push(...connection.nodes.map(p=>p.id));after=connection.pageInfo.hasNextPage?connection.pageInfo.endCursor:null;}while(after);
 return new Map(ids.map((id,index)=>[id,index]));
}
export async function getCollection(env:Record<string,string>,handle:string,url:URL,signal:AbortSignal){
 if(!/^[a-z0-9-]{1,255}$/.test(handle))throw new Response('Collection not found',{status:404});
 if(fastCollectionFirstPage(url.searchParams,handle)){
  const defaultSort='collection-default',state=parseCollectionState(url.searchParams,[],defaultSort),key=`${env.PUBLIC_STORE_DOMAIN}:${handle}:${state.sort}`,hit=firstPages.get(key);
  const page=hit&&hit.expires>Date.now()?hit.value:await loadFirstPage(env,handle,state.sort,signal);
  if(!hit||hit.expires<=Date.now()){if(firstPages.size>=30)firstPages.delete(firstPages.keys().next().value!);firstPages.set(key,{expires:Date.now()+60_000,value:page});}
  const {metadata,products,hasNextPage}=page;
  // The exact total is intentionally unknown until the full index is needed.
  return {defaultSort,collection:{handle:metadata.handle,title:metadata.title,description:metadata.description,image:metadata.image,seo:metadata.seo,total:null},products,filters:[] as CollectionFilter[],filtersDeferred:true,state,pagination:{page:1,pageCount:hasNextPage?2:1,total:null,start:products.length?1:0,end:products.length,offset:0}};
 }
 const catalog=await loadCatalog(env,handle,signal),{metadata,products:all,filters}=catalog;
 const defaultSort=catalog.defaultSort,state=parseCollectionState(url.searchParams,filters,defaultSort),emptyState={selected:[],min:'',max:'',sort:'featured'};
 const baseline=collectionFacets(all,emptyState,filters),facets=collectionFacets(all,state,filters);
 const selected=all.filter(collectionMatcher(state,filters));
 let rank:Map<string,number>|undefined;
 if(state.sort!==defaultSort&&state.sort==='best-selling'){catalog.bestRank??=await collectionRank(env,handle,signal,'BEST_SELLING',catalog.synthetic);rank=catalog.bestRank;}
 if(state.sort!==defaultSort&&state.sort==='featured'){catalog.manualRank??=await collectionRank(env,handle,signal,'MANUAL',catalog.synthetic);rank=catalog.manualRank;}
 const ordered=state.sort===defaultSort?selected:sortCollection(selected,state.sort,rank),pagination=collectionPage(url.searchParams,ordered.length);
 const pageIds=ordered.slice(pagination.offset,pagination.offset+24).map(product=>product.id);
 let cards:CardNode[]=[];
 if(pageIds.length){const data=await requestStorefront<{nodes:(CardNode|null)[]}>(env,`query CollectionPageCards($ids:[ID!]!) @inContext(country:PK,language:EN){nodes(ids:$ids){... on Product{${cardFields}}}}`,{ids:pageIds},signal);const byId=new Map(data.nodes.filter((product):product is CardNode=>!!product).map(product=>[product.id,product]));cards=pageIds.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);}
 const description=metadata.description;
 return {defaultSort,collection:{handle:metadata.handle,title:metadata.title,description,image:metadata.image,seo:metadata.seo,total:all.length},products:cards.map(toCard),filters:visibleCollectionFacets(facets,baseline,state.selected),filtersDeferred:false,state,pagination};
}
