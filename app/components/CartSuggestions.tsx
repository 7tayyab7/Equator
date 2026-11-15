import {CardPrice} from './CardPrice';
import {useEffect,useState} from 'react';
import {Link} from 'react-router';
import {responsiveImage} from '../lib/images';
import type {ProductCardData} from '../lib/products.server';
export function CartSuggestions({handles,close}:{handles:string;close:()=>void}){
 const [products,setProducts]=useState<ProductCardData[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{setProducts([]);setLoading(true);if(!handles){setLoading(false);return;}const controller=new AbortController();fetch(`/resources/cart-suggestions?handles=${encodeURIComponent(handles)}`,{signal:controller.signal}).then(r=>r.ok?r.json() as Promise<{products:ProductCardData[]}>:{products:[]}).then(data=>setProducts(data.products)).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[handles]);
 if(loading)return <section className="bag-suggestions" aria-busy="true"><h3>Complete your look</h3><p role="status">Finding matching pieces…</p></section>;
 if(!products.length)return null;
 return <section className="bag-suggestions" aria-label="Complete your look"><h3>Complete your look</h3><div>{products.map(product=><Link onClick={close} key={product.id} to={`/products/${product.handle}`}>{product.images[0]&&<img {...responsiveImage(product.images[0].url,240,[120,240,360],'140px',product.images[0].width)} width="140" height="180" loading="lazy" alt={product.images[0].alt||product.title}/>}<span>{product.title}</span><CardPrice product={product}/></Link>)}</div></section>;
}
