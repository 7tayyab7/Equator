import {loadJSON} from '../lib/json-request.client';
import {ArrowIcon} from './ArrowIcon';
import {useEffect,useRef,useState,useId} from 'react';
import {ProductCard} from './ProductCard';
import type {ProductCardData} from '../lib/products.server';
import {updateHistory} from '../lib/product-helpers';
export function ProductRail({title,products,sectionId}:{title:string;products:ProductCardData[];sectionId?:string}){
 const rail=useRef<HTMLDivElement>(null),id=useId();const [edges,setEdges]=useState({start:true,end:false});
 useEffect(()=>{const node=rail.current;if(!node)return;const measure=()=>setEdges({start:node.scrollLeft<2,end:node.scrollLeft+node.clientWidth>=node.scrollWidth-2});const observer=new ResizeObserver(measure);observer.observe(node);node.addEventListener('scroll',measure,{passive:true});measure();return()=>{observer.disconnect();node.removeEventListener('scroll',measure);};},[products]);
 if(!products.length)return null;
 function move(direction:number){const node=rail.current;if(node)node.scrollBy({left:direction*node.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
 return <section id={sectionId} className="pdp-rail" aria-labelledby={id}><div className="pdp-rail-heading"><h2 id={id}>{title}</h2><div><button aria-label={`Previous ${title} products`} disabled={edges.start} onClick={()=>move(-1)}><ArrowIcon direction="left"/></button><button aria-label={`Next ${title} products`} disabled={edges.end} onClick={()=>move(1)}><ArrowIcon/></button></div></div><div className="pdp-rail-track" ref={rail} tabIndex={0} aria-label={`${title} products`}>{products.map(product=><ProductCard key={product.id} product={product}/>)}</div></section>;
}
export function RecentlyViewed({current}:{current:string}){
 const [products,setProducts]=useState<ProductCardData[]>([]);
 useEffect(()=>{const controller=new AbortController();setProducts([]);try{let saved:unknown=[];try{saved=JSON.parse(localStorage.getItem('equator-recent-products')||'[]');}catch{/* Recover an invalid history without losing the current view. */}const history=updateHistory(saved,current);localStorage.setItem('equator-recent-products',JSON.stringify(history));const previous=history.filter(id=>id!==current);if(previous.length)loadJSON<{products:ProductCardData[]}>(`/resources/recent-products?ids=${encodeURIComponent(previous.join(','))}`,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setProducts(data.products);}).catch(()=>{});}catch{/* Storage is optional; private browsers can deny access. */}return()=>controller.abort();},[current]);
 return <ProductRail title="Recently Viewed" products={products}/>;
}
