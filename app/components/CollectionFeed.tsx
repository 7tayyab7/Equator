import {useCallback,useEffect,useRef,useState} from 'react';
import {ProductCard} from './ProductCard';
import type {ProductCardData} from '../lib/products.server';
import {appendUniqueProducts} from '../lib/collection-feed';
type Feed={products:ProductCardData[];pagination:{page:number;pageCount:number}};
const restored=new Map<string,{expires:number;feed:Feed}>();
export function CollectionFeed({handle,stateKey,initial,paused,menuContext}:{handle:string;stateKey:string;initial:Feed;paused:boolean;menuContext?:string}){
 const cacheKey=`${handle}?${stateKey}&start=${initial.pagination.page}`;
 const [feed,setFeed]=useState<Feed>(()=>{const saved=typeof window!=='undefined'?restored.get(cacheKey):undefined;return saved&&saved.expires>Date.now()?saved.feed:initial;}),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const sentinel=useRef<HTMLDivElement>(null),request=useRef<AbortController|null>(null),locked=useRef(false);
 const more=feed.pagination.page<feed.pagination.pageCount;
 const nextParams=new URLSearchParams(stateKey);nextParams.set('page',String(feed.pagination.page+1));if(menuContext)nextParams.set('menu',menuContext);
 const nextHref=`/collections/${handle}?${nextParams}`;
 useEffect(()=>{restored.delete(cacheKey);restored.set(cacheKey,{expires:Date.now()+300000,feed});if(restored.size>4)restored.delete(restored.keys().next().value!);},[cacheKey,feed]);
 useEffect(()=>()=>request.current?.abort(),[]);
 const load=useCallback(async()=>{
  if(locked.current||!more||paused)return;locked.current=true;setLoading(true);setError('');
  const controller=new AbortController();request.current=controller;const page=feed.pagination.page+1;
  const params=new URLSearchParams(stateKey);params.set('handle',handle);params.set('page',String(page));
  try{const response=await fetch(`/resources/collection-products?${params}`,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});const data=await response.json() as Feed&{handle?:string;stateKey?:string;error?:string};
   if(!response.ok||data.handle!==handle||data.stateKey!==stateKey||!Array.isArray(data.products)||data.pagination?.page!==page)throw new Error(data.error||'Products changed. Please refresh this collection.');
   if(!controller.signal.aborted)setFeed(current=>({products:appendUniqueProducts(current.products,data.products),pagination:data.pagination}));
  }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'More products could not be loaded.');}
  finally{locked.current=false;if(!controller.signal.aborted)setLoading(false);}
 },[feed.pagination.page,handle,more,paused,stateKey]);
 useEffect(()=>{const node=sentinel.current;if(!node||!more||paused||loading||error||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))void load();},{rootMargin:'300px'});observer.observe(node);return()=>observer.disconnect();},[more,paused,loading,error,load]);
 return <><div className="product-grid collection-grid">{feed.products.map((product,index)=><ProductCard key={product.id} product={product} collection priority={index===0} eager={index<4}/>)}</div><div className="collection-feed-tail" ref={sentinel}>
  {error&&<p role="alert">{error}</p>}{loading?<p role="status">Loading more products…</p>:more?<a href={nextHref} onClick={event=>{event.preventDefault();void load();}} aria-disabled={paused}>{error?'Try again':'Load more'}</a>:<p role="status">You’ve reached the end.</p>}
 </div></>;
}
