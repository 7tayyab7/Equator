import customerCare from '../content/customer-care.json';
import returnsPolicy from '../content/return-exchange-policy.json';
import {parseDetails,splitProductDetails} from './product-details.server';
import {cardCompareAt} from './card-pricing';
import {requestStorefront} from './storefront.server';
import {cleanContent} from './content-html.server';
import {nextPageCursor} from './pagination';
import type {ProductCardData} from './products.server';
import {displayProductTitle,uniqueAvailable,colorLabel,colorProductHandles,type Variant,type Money} from './product-helpers';

export const cardFields=`id handle title productType availableForSale description priceRange {minVariantPrice {amount currencyCode} maxVariantPrice {amount currencyCode}} compareAtPriceRange {minVariantPrice {amount currencyCode} maxVariantPrice {amount currencyCode}} images(first:100){nodes{url width height altText}}`;
export type CardNode={id:string;handle:string;title:string;productType:string;availableForSale:boolean;description:string;compareAtPriceRange?:{minVariantPrice:Money;maxVariantPrice:Money};priceRange:{minVariantPrice:Money;maxVariantPrice:Money};images:{nodes:{url:string;width:number;height:number;altText:string|null}[]}};
export function toCard(p:CardNode):ProductCardData{return {id:p.id,handle:p.handle,title:displayProductTitle(p.title),available:p.availableForSale,price:Number(p.priceRange.minVariantPrice.amount),compareAtPrice:cardCompareAt(Number(p.priceRange.minVariantPrice.amount),Number(p.priceRange.maxVariantPrice.amount),p.compareAtPriceRange?Number(p.compareAtPriceRange.minVariantPrice.amount):undefined,p.compareAtPriceRange?Number(p.compareAtPriceRange.maxVariantPrice.amount):undefined),currency:p.priceRange.minVariantPrice.currencyCode,priceVaries:p.priceRange.minVariantPrice.amount!==p.priceRange.maxVariantPrice.amount,images:p.images.nodes.map(i=>({...i,alt:i.altText||p.title}))};}
export type Product=CardNode&{descriptionHtml:string;detailsMetafield?:{type:string;value:string}|null;vendor:string;tags:string[];seo:{title:string|null;description:string|null};options:{name:string;optionValues:{name:string}[]}[];variants:{nodes:Variant[];pageInfo:{hasNextPage:boolean;endCursor:string}};collections:{nodes:{id:string;handle:string;title:string}[]};gallery:{nodes:{url:string;width:number;height:number;altText:string|null}[]}};
const variantFields=`id title sku availableForSale selectedOptions{name value} price{amount currencyCode} compareAtPrice{amount currencyCode} image{url width height altText}`;
const query=`query ProductDetail($handle:String!) @inContext(country:PK,language:EN){product(handle:$handle){${cardFields.replace("images(first:100)","images(first:1)")} descriptionHtml detailsMetafield:metafield(namespace:"equator_redesign",key:"details"){type value} vendor tags seo{title description} options{name optionValues{name}} variants(first:250){nodes{${variantFields}} pageInfo{hasNextPage endCursor}} collections(first:100){nodes{id handle title}} gallery:images(first:100){nodes{url width height altText}}}}`;
type LegacyContent={colors:string[];care:string|null;returns:string|null};
export async function getProduct(env:Record<string,string>,handle:string,signal:AbortSignal){
 if(!/^[a-z0-9-]{1,255}$/.test(handle))throw new Response('Product not found',{status:404});
 const {product}=await requestStorefront<{product:Product|null}>(env,query,{handle},signal);
 if(!product)throw new Response('Product not found',{status:404});
 product.title=displayProductTitle(product.title);
 const variantCursors=new Set<string>();
 while(product.variants.pageInfo.hasNextPage){const after=nextPageCursor(product.variants.pageInfo,variantCursors);const next=await requestStorefront<{product:{variants:Product['variants']}|null}>(env,`query MoreVariants($handle:String!,$after:String!) @inContext(country:PK){product(handle:$handle){variants(first:250,after:$after){nodes{${variantFields}} pageInfo{hasNextPage endCursor}}}}`,{handle,after},signal);if(!next.product)throw new Response('Product not found',{status:404});product.variants.nodes.push(...next.product.variants.nodes);product.variants.pageInfo=next.product.variants.pageInfo;}
 const extras=await getExtras(env,product,{colors:[],care:customerCare.body,returns:null},signal);
 const extracted=splitProductDetails(product.descriptionHtml);
 const details=product.detailsMetafield?.type==='multi_line_text_field'?parseDetails(product.detailsMetafield.value):extracted.details;
 return {product,...extras,descriptionHtml:cleanContent(extracted.descriptionHtml),details};
}
async function getExtras(env:Record<string,string>,product:Product,legacy:LegacyContent,signal:AbortSignal){

 const collection=product.collections.nodes.find(c=>!/sale|discount|size|test|all|new|best|natws|wstoss/i.test(c.title))||product.collections.nodes[0];
 const defaults={colors:[{handle:product.handle,title:colorLabel(product.descriptionHtml,product.title),image:product.images.nodes[0]?.url}],care:legacy.care,returns:cleanContent(returnsPolicy.body),shipping:null as string|null,pair:[] as ProductCardData[],related:[] as ProductCardData[]};
 try{
 const colorHandles=[...new Set([...colorProductHandles(product.handle),...legacy.colors])];
 const aliases=colorHandles.map((_,i)=>`c${i}:product(handle:$c${i}){handle title descriptionHtml images(first:1){nodes{url}}}`).join(' ');
 const data=await requestStorefront<{same:{nodes:CardNode[]};collection:{products:{nodes:CardNode[]}}|null;manualRelated:CardNode[]|null;shipping:{body:string}|null;refund:{body:string}|null;[key:string]:unknown}>(env,`query ProductExtras($same:String!,$collection:String!,${colorHandles.map((_,i)=>`$c${i}:String!`).join(',')}) @inContext(country:PK,language:EN){same:products(first:24,query:$same,sortKey:BEST_SELLING){nodes{${cardFields}}} collection(handle:$collection){products(first:24){nodes{${cardFields}}}} manualRelated:productRecommendations(productId:"${product.id}",intent:RELATED){${cardFields}} shipping:page(handle:"shipping-policy"){body} refund:page(handle:"return-exchange-policy"){body} ${aliases}}`,{same:`product_type:'${product.productType.replace(/'/g,'')}' AND available_for_sale:true`,collection:collection?.handle||'',...Object.fromEntries(colorHandles.map((h,i)=>[`c${i}`,h]))},signal);
 const pair:ProductCardData[]=[];
 const relatedPool=[...data.same.nodes,...(data.collection?.products.nodes||[]),...(data.manualRelated||[])];
 const related=uniqueAvailable(relatedPool,[product.id,...pair.map(p=>p.id)]);
 type ColorProduct={handle:string;title:string;descriptionHtml:string;images:{nodes:{url:string}[]}};
 const colors=colorHandles.map((_,i)=>data[`c${i}`] as ColorProduct|null).filter((p):p is ColorProduct=>!!p).map(p=>({handle:p.handle,title:colorLabel(p.descriptionHtml,p.title),image:p.images.nodes[0]?.url}));
 return {...defaults,colors:colors.length?colors:defaults.colors,pair,related:related.map(toCard),shipping:data.shipping?.body?cleanContent(data.shipping.body):null};
 }catch{return {...defaults,pair:[]};}
}
