import {complementaryProducts,isWaistcoat} from './product-helpers.ts';
import {isFullPriceRecommendation,type RecommendationPricing} from './full-price.ts';
export type PairingSource={id:string;productType:string;title?:string;handle?:string};
type PairCandidate=RecommendationPricing&{id:string;title:string;description:string;productType:string;availableForSale:boolean;handle?:string};
/** Normalize matching only; Shopify product data is never edited. */
export function pairingType(product:Pick<PairingSource,'productType'|'title'|'handle'>):string {
 function classify(value:string){const text=value.toLowerCase().replace(/[-_]/g,' ');
  if(/waist\s*coat/.test(text))return 'Waistcoat';
  if(/shalwar\s*kameez|kameez\s*shalwar/.test(text))return 'Shalwar Kameez';
  if(/kurta\s*shalwar/.test(text))return 'Kurta Shalwar';
  if(/kurta\s*trouser/.test(text))return 'Kurta Trouser';
  if(/qaftaa?n/.test(text))return 'Qaftan';
  if(/\bkurta\b/.test(text))return 'Kurta';
  if(/jeans?|denim/.test(text))return 'Jeans';
  if(/cargo/.test(text))return 'Cargo Pants';
  if(/jogger|track\s*pant/.test(text))return 'Joggers';
  if(/\bshorts?\b/.test(text))return 'Shorts';
  if(/knit.*trouser|trouser.*knit/.test(text))return 'Trouser Knit';
  if(/\b(?:pants?|pents?|chinos?|trousers?)\b/.test(text))return 'Pants';
  if(/formal.*shirt|dress.*shirt/.test(text))return 'Formal Shirt';
  if(/\bsuit/.test(text))return 'Suit';
  if(/blazer|\bcoat\b/.test(text))return 'Blazer';
  if(/jacket|overshirt/.test(text))return 'Jacket';
  if(/hoodie|sweat\s*shirt|\bupper/.test(text))return 'Sweatshirt';
  if(/sweater|knit.*vest|wool.*vest/.test(text))return 'Sweater';
  if(/t\s*shirt|\btee\b/.test(text))return 'T-Shirt';
  if(/polo/.test(text))return 'Polo';
  if(/smart.*casual.*shirt/.test(text))return 'Smart Casual Shirt';
  if(/shirt/.test(text))return 'Casual Shirt';
  return '';
 }
 return classify(product.productType)||classify(`${product.title||''} ${product.handle||''}`)||product.productType.trim();
}
/** PDP and bag share exact type/style/availability and sale eligibility. */
export function pairedProducts<T extends PairCandidate>(current:PairingSource,candidates:T[],excluded:string[]=[],limit=8):T[]{
 const source={...current,productType:pairingType(current)};
 const normalized=candidates.map(p=>({...p,productType:pairingType(p)}));
 const fullPrice=complementaryProducts(source,normalized.filter(p=>isWaistcoat(source.productType)||isFullPriceRecommendation(p)),excluded,limit);
 // Sale fallback is merchant-approved when no suitable full-price match exists.
 return fullPrice.length?fullPrice:complementaryProducts(source,normalized,excluded,limit);
}
