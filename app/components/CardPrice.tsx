import {discountPercent} from '../lib/card-pricing';
import type {ProductCardData} from '../lib/products.server';
export function CardPrice({product}:{product:Pick<ProductCardData,'price'|'compareAtPrice'|'currency'|'priceVaries'>}) {
 const sale=typeof product.compareAtPrice==='number'&&product.compareAtPrice>product.price;
 const percent=discountPercent(product.price,product.compareAtPrice);
 const money=(amount:number)=>`${product.currency} ${new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format(amount)}`;
 return <p className="product-card-prices">{sale&&<del aria-label={`Original price ${money(product.compareAtPrice!)}`}>{money(product.compareAtPrice!)}</del>}<span>{product.priceVaries?'From ':''}{money(product.price)}</span>{percent!==undefined&&<span className="product-card-discount" aria-label={`${percent}% off`}>-{percent}%</span>}</p>;
}
