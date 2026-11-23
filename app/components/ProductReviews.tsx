import {loadJSON} from '../lib/json-request.client';
import {useEffect,useRef,useState} from 'react';
import {WriteProductReview} from './WriteProductReview';
export type ReviewData={count:number;rating:number;page:number;pages:number;reviews:{id:string;title:string;rating:number;body:string;name:string;verified:boolean;date:string}[]};
export function useProductReviews(id:string,initial:ReviewData|null=null){
 const [data,setData]=useState<ReviewData|null>(initial),[page,setPage]=useState(initial?.page||1),[error,setError]=useState(''),[busy,setBusy]=useState(!initial),usedInitial=useRef(false);
 useEffect(()=>{if(!usedInitial.current){usedInitial.current=true;if(initial){setBusy(false);return;}}const controller=new AbortController();setBusy(true);setError('');loadJSON<ReviewData>(`/resources/product-reviews?${new URLSearchParams({id,page:String(page)})}`,{signal:controller.signal}).then(setData).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[id,page]);
 return {data,page,setPage,busy,error};
}
export function ProductReviews({state,productId,productTitle}:{state:ReturnType<typeof useProductReviews>;productId:string;productTitle:string}){
 const {data,setPage,busy,error}=state;
 return <section className="product-reviews" id="customer-reviews" aria-labelledby="product-reviews-heading" aria-busy={busy}>
 <WriteProductReview key={productId} productId={productId} productTitle={productTitle} summary={<><h2 id="product-reviews-heading">Customer reviews</h2><p>{data?(data.count?`${data.rating.toFixed(1)} / 5 · ${data.count} ${data.count===1?'review':'reviews'}`:'No reviews yet for this product.'):''}</p><p className="review-source">Reviews provided by Judge.me.</p></>}/>
 {error?<p role="status">{error}</p>:!data?<p role="status">Loading customer reviews…</p>:<><div className="product-review-list">{data.reviews.map(review=><article key={review.id}><div><strong>{review.name||'Customer'}</strong>{review.verified&&<span>Verified buyer</span>}<span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0,Math.min(5,review.rating)))}{'☆'.repeat(Math.max(0,5-review.rating))}</span></div>{review.title&&<h3>{review.title}</h3>}<p>{review.body}</p><time dateTime={review.date}>{new Date(review.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</time></article>)}</div>{data.pages>1&&<nav aria-label="Review pages"><button disabled={busy||data.page<=1} onClick={()=>setPage(data.page-1)}>Previous reviews</button><span>{data.page} / {data.pages}</span><button disabled={busy||data.page>=data.pages} onClick={()=>setPage(data.page+1)}>Next reviews</button></nav>}</>}
 </section>;
}
