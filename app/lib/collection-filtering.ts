import type {CollectionFilter,CollectionState} from './collection-state';
type Metafield={namespace:string;key:string;value:string}|null;
export type IndexedVariant={availableForSale:boolean;selectedOptions:{name:string;value:string}[];price:{amount:string};metafields?:Metafield[]};
export type IndexedProduct={id:string;title:string;productType:string;vendor:string;tags:string[];createdAt:string;availableForSale:boolean;category:{id:string}|null;priceRange:{minVariantPrice:{amount:string}};metafields?:Metafield[];variants:{nodes:IndexedVariant[]}};
type Input=Record<string,unknown>;
export function filterInput(value:string):Input|null{try{const input=JSON.parse(value);return input&&typeof input==='object'&&!Array.isArray(input)?input:null;}catch{return null;}}
export function supportsInput(input:Input|null){return !!input&&Object.keys(input).length===1&&['available','price','variantOption','productType','productVendor','tag','category','productMetafield','variantMetafield','taxonomyMetafield'].includes(Object.keys(input)[0]);}
function metafieldMatches(fields:Metafield[]|undefined,input:unknown){const wanted=input as {namespace:string;key:string;value:string};const field=fields?.find(f=>f?.namespace===wanted.namespace&&f.key===wanted.key);if(!field)return false;try{const values=JSON.parse(field.value);return Array.isArray(values)?values.includes(wanted.value):field.value===wanted.value;}catch{return field.value===wanted.value;}}
export function inStock(product:IndexedProduct){return product.availableForSale&&product.variants.nodes.some(v=>v.availableForSale);}
function productMatches(product:IndexedProduct,input:Input){
 if('available' in input)return inStock(product)===input.available;
 if('productType' in input)return product.productType===input.productType;
 if('productVendor' in input)return product.vendor===input.productVendor;
 if('tag' in input)return product.tags.includes(String(input.tag));
 if('category' in input){const expected=String((input.category as {id:string}).id).split('/').pop()!,actual=product.category?.id.split('/').pop();return !!actual&&(actual===expected||actual.startsWith(`${expected}-`));}
 if('productMetafield' in input)return metafieldMatches(product.metafields,input.productMetafield);
 if('taxonomyMetafield' in input)return metafieldMatches(product.metafields,input.taxonomyMetafield);
 return false;
}
function variantMatches(variant:IndexedVariant,input:Input){
 if('variantOption' in input){const option=input.variantOption as {name:string;value:string};return variant.selectedOptions.some(o=>o.name.toLowerCase()===option.name.toLowerCase()&&o.value===option.value);}
 if('variantMetafield' in input)return metafieldMatches(variant.metafields,input.variantMetafield);
 return false;
}
/** OR within a facet, AND between facets; selected options must coexist on a buyable variant. */
export function collectionMatcher(state:CollectionState,filters:CollectionFilter[],ignoreGroup?:string){
 const selected=new Set(state.selected),variantGroups:Input[][]=[],productGroups:Input[][]=[];
 for(const group of filters){if(group.id===ignoreGroup||group.type==='PRICE_RANGE')continue;const choices=group.values.filter(v=>selected.has(v.id)).map(v=>filterInput(v.input)).filter((i):i is Input=>!!i);if(!choices.length)continue;
  if(choices.every(input=>'variantOption' in input||'variantMetafield' in input))variantGroups.push(choices);
  else productGroups.push(choices);
 }
 const priceGroup=filters.find(f=>f.type==='PRICE_RANGE');
 const hasPrice=priceGroup?.id!==ignoreGroup&&(state.min!==''||state.max!=='');
 return (product:IndexedProduct)=>{
 if(!productGroups.every(choices=>choices.some(input=>productMatches(product,input))))return false;
 if(!variantGroups.length&&!hasPrice)return true;
 return product.variants.nodes.some(variant=>{
  if(variantGroups.length&&(!inStock(product)||!variant.availableForSale))return false;
  if(!variantGroups.every(choices=>choices.some(input=>variantMatches(variant,input))))return false;
  const price=Number(variant.price.amount);return !hasPrice||((state.min===''||price>=Number(state.min))&&(state.max===''||price<=Number(state.max)));
 });
 };
}
export function matchesCollection(product:IndexedProduct,state:CollectionState,filters:CollectionFilter[],ignoreGroup?:string){return collectionMatcher(state,filters,ignoreGroup)(product);}
export function collectionFacets(products:IndexedProduct[],state:CollectionState,filters:CollectionFilter[]){
 return filters.map(group=>group.type==='PRICE_RANGE'?group:{...group,values:group.values.map(value=>({ ...value,count:products.filter(collectionMatcher({...state,selected:[...state.selected.filter(id=>!group.values.some(v=>v.id===id)),value.id]},filters)).length}))});
}
export function visibleCollectionFacets(filters:CollectionFilter[],baseline:CollectionFilter[],selected:string[]){
 return filters.filter(group=>group.type==='PRICE_RANGE'||group.values.some(v=>selected.includes(v.id))||group.values.some(v=>filterInput(v.input)?.available!==undefined)||(baseline.find(f=>f.id===group.id)?.values.filter(v=>v.count>0).length||0)>1);
}
export function sortCollection<T extends IndexedProduct>(products:T[],sort:string,bestRank?:Map<string,number>):T[]{
 if(sort==='collection-default'||sort==='featured'&&!bestRank)return products;
 const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true}),manual=new Map(products.map((p,i)=>[p.id,i]));
 return [...products].sort((a,b)=>{let order=0;
  if(sort==='best-selling'||sort==='featured')order=(bestRank?.get(a.id)??Infinity)-(bestRank?.get(b.id)??Infinity);
  else if(sort.startsWith('price-'))order=Number(a.priceRange.minVariantPrice.amount)-Number(b.priceRange.minVariantPrice.amount);
  else if(sort.startsWith('title-'))order=collator.compare(a.title,b.title);
  else if(sort.startsWith('created-'))order=Date.parse(a.createdAt)-Date.parse(b.createdAt);
  if(sort.endsWith('descending'))order=-order;
  return order||manual.get(a.id)!-manual.get(b.id)!;
 });
}
export function collectionPage(params:URLSearchParams,total:number,pageSize=24){
 const pageCount=Math.max(1,Math.ceil(total/pageSize));const raw=params.get('page');let requested=raw&&/^\d{1,7}$/.test(raw)?Number(raw):1;
 // Preserve old Storefront cursor bookmarks when their offset is supplied by Shopify.
 if(!raw){const cursor=params.get('after')||params.get('before');if(cursor&&cursor.length<2048)try{const value=JSON.parse(atob(cursor)),offset=value.offset;if(Number.isInteger(offset)&&offset>=0)requested=params.has('after')?Math.floor((offset+1)/pageSize)+1:Math.max(1,Math.floor(offset/pageSize));}catch{/* Invalid old cursors simply open page one. */}}
 const page=Math.max(1,Math.min(pageCount,requested));return {page,pageCount,total,start:total?(page-1)*pageSize+1:0,end:Math.min(page*pageSize,total),offset:(page-1)*pageSize};
}
export function pageNumbers(page:number,count:number):(number|'…')[]{const pages=[...new Set([1,count,...Array.from({length:count<=9?count:5},(_,i)=>count<=9?i+1:page-2+i)])].filter(n=>n>=1&&n<=count).sort((a,b)=>a-b);return pages.flatMap((n,i)=>i&&n-pages[i-1]>1?['…',n] as (number|'…')[]:[n]);}
