import {requestStorefront} from './storefront.server';
import {cardFields,toCard,type CardNode} from './product.server';
import features from '../content/menu-features.json';
import editorial from '../content/editorial-pages.json';
const categories=[['CASUAL','Casual','casual'],['FORMALS','Formals','formals'],['ACTIVE WEAR','Active Wear','active-wear'],['ACCESSORIES','Accessories','accessories']] as const;
type Image={url:string;width:number;height:number;altText:string|null};
export type Category={title:string;handle:string;image:Image|null};
type Collection={handle:string;title:string;image:Image|null;products:{nodes:{featuredImage:Image|null}[]}};
const fallback:Category[]=categories.map(([key,title,handle])=>{const card=features[key as keyof typeof features]?.[0];return {title,handle,image:card?{url:card.image,width:440,height:587,altText:card.alt}:null};});
const cache=new Map<string,{expires:number;value:{categories:Category[];newProducts:ReturnType<typeof toCard>[];bestProducts:ReturnType<typeof toCard>[]}}>();
export async function getMerchandising(env:Record<string,string>,signal:AbortSignal,sections={categories:true,bestSellers:true}){
 const key=`${env.PUBLIC_STORE_DOMAIN}:${sections.categories}:${sections.bestSellers}`;
 const hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 try{
  const data=await requestStorefront<Record<string,Collection|null>&{arrivals:{products:{nodes:CardNode[]}}|null;best:{products:{nodes:CardNode[]}}|null}>(env,`query HomepageMerchandising($categories:Boolean!,$best:Boolean!) @inContext(country:PK,language:EN){${categories.map(([, ,handle],i)=>`c${i}:collection(handle:"${handle}") @include(if:$categories){handle title image{url width height altText}products(first:1){nodes{featuredImage{url width height altText}}}}`).join(' ')} arrivals:collection(handle:"new-arrivals"){products(first:24,sortKey:MANUAL){nodes{${cardFields}}}} best:collection(handle:"best-selling") @include(if:$best){products(first:32,sortKey:BEST_SELLING){nodes{${cardFields}}}}}`,{categories:sections.categories,best:sections.bestSellers},AbortSignal.any([signal,AbortSignal.timeout(2500)]));
  const value={categories:categories.flatMap(([,title],i)=>{const c=data[`c${i}`];return c?[{title,handle:c.handle,image:c.image||c.products.nodes[0]?.featuredImage||null}]:[];}),newProducts:(data.arrivals?.products.nodes||[]).filter(p=>p.availableForSale&&p.images.nodes.length).map(toCard),bestProducts:(data.best?.products.nodes||[]).filter(p=>p.availableForSale&&p.images.nodes.length).map(toCard)};
  if(cache.size>=5)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+60_000,value});return value;
 }catch(error){if(signal.aborted)throw error;return hit?.value||{categories:fallback,newProducts:[],bestProducts:[]};}
}
export function archiveCampaigns(){return Object.entries(editorial.pages).filter(([handle])=>/-25$/.test(handle)).map(([handle,page])=>{const hero=page.hero as {mobile?:{url:string;width:number;height:number;alt:string};desktop?:{url:string;width:number;height:number;alt:string}};return {handle,title:handle.replace(/-25$/," ’25").replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()),image:hero.mobile||hero.desktop||page.images[0]};});}
