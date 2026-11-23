import {ArrowIcon} from './ArrowIcon';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useLocation} from 'react-router';
export function CollectionCategoryNav({children}:{children:ReactNode}){
 const rail=useRef<HTMLElement>(null),{pathname,search}=useLocation();const [edges,setEdges]=useState({left:false,right:false});
 useEffect(()=>{const node=rail.current;if(!node)return;node.scrollLeft=0;const measure=()=>setEdges({left:node.scrollLeft>2,right:node.scrollLeft+node.clientWidth<node.scrollWidth-2});const observer=new ResizeObserver(measure);observer.observe(node);node.addEventListener('scroll',measure,{passive:true});measure();return()=>{observer.disconnect();node.removeEventListener('scroll',measure);};},[pathname,search]);
 const move=(direction:number)=>{const node=rail.current;if(node)node.scrollBy({left:direction*node.clientWidth*.75,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});};
 return <div className="collection-nav-shell" data-overflow={edges.right}><nav ref={rail} className="collection-category-nav" aria-label="Collections">{children}</nav>{edges.left&&<button className="category-scroll-prev" aria-label="Previous categories" onClick={()=>move(-1)}><ArrowIcon direction="left"/></button>}{edges.right&&<button className="category-scroll-next" aria-label="More categories" onClick={()=>move(1)}><ArrowIcon/></button>}</div>;
}
