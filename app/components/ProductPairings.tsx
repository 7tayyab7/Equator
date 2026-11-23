import {loadJSON} from '../lib/json-request.client';
import {useEffect,useState} from 'react';
import {ProductRail} from './ProductRail';
import type {ProductCardData} from '../lib/products.server';
export function ProductPairings({handle}:{handle:string}){
 const [products,setProducts]=useState<ProductCardData[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();setProducts([]);setLoading(true);
 loadJSON<{products:ProductCardData[]}>(`/resources/product-pairings?handle=${encodeURIComponent(handle)}`,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setProducts(data.products);}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
 return()=>controller.abort();},[handle]);
 if(loading)return <section className="pdp-rail" aria-label="Pair It With" aria-busy="true"><h2>Pair It With</h2><p role="status">Finding pieces to complete your look…</p></section>;
 return <ProductRail title="Pair It With" products={products}/>;
}
