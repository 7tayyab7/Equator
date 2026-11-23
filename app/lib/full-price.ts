type Price={amount:string;currencyCode:string};
export type RecommendationPricing={priceRange:{minVariantPrice:Price;maxVariantPrice:Price};compareAtPriceRange?:{minVariantPrice:Price;maxVariantPrice:Price}};

/** Only recommend products whose price ranges rule out a discounted variant.
 * Comparing to the minimum price deliberately excludes ambiguous mixed-price ranges.
 * Card markdown display logic is less strict and cannot guarantee this rule.
 */
export function isFullPriceRecommendation(product:RecommendationPricing):boolean{
 const price=product.priceRange.minVariantPrice,maximum=product.priceRange.maxVariantPrice,compare=product.compareAtPriceRange?.maxVariantPrice;
 if(!compare||compare.currencyCode!==price.currencyCode||maximum.currencyCode!==price.currencyCode)return false;
 const minimumAmount=Number(price.amount),maximumAmount=Number(maximum.amount),compareAmount=Number(compare.amount);
 return [minimumAmount,maximumAmount,compareAmount].every(value=>Number.isFinite(value)&&value>=0)&&maximumAmount>=minimumAmount&&compareAmount<=minimumAmount;
}
