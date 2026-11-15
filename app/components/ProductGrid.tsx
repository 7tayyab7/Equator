import {ArrowIcon} from './ArrowIcon';
import {Link} from 'react-router';
import type {ProductCardData} from '../lib/products.server';
import {ProductCard} from './ProductCard';
export function ProductGrid({heading,products,source,id="product-section-title",href}:{heading:string;products:ProductCardData[];source:string;id?:string;href?:string}) {
  return <section className="product-section" aria-labelledby={id}>
    <div className="product-section-heading"><h2 id={id} className="footer-heading">{heading}</h2>{href&&<Link to={href}>View all <ArrowIcon/></Link>}</div>
    {source==='snapshot'&&<p className="product-feed-note">Showing saved product details while the current catalog is unavailable. Confirm price and availability on the product page.</p>}
    <div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>
  </section>;
}
