import config from '../content/reviews-public.json';
type PublishedReview={uuid:string;title:string;rating:number;body:string;reviewer_name:string;verified_buyer:boolean;created_at:string};
const cache=new Map<string,{expires:number;value:unknown}>();
export async function loadPublishedReviews(request:Request){
 const url=new URL(request.url),id=(url.searchParams.get('id')||'').replace('gid://shopify/Product/',''),rawPage=Number(url.searchParams.get('page')||1),page=Number.isInteger(rawPage)&&rawPage>0&&rawPage<=1000?rawPage:1;
 if(!/^\d{5,20}$/.test(id))return Response.json({error:'Product reviews unavailable.'},{status:400});
 const key=`${id}:${page}`,hit=cache.get(key);if(hit&&hit.expires>Date.now())return Response.json(hit.value,{headers:{'Cache-Control':'public, max-age=120'}});
 try{
  const params=new URLSearchParams({api_token:config.publicToken,shop_domain:config.shop,external_id:id,platform:'shopify',page:String(page),per_page:'5',json_request:'true'});
  const read=async(endpoint:string)=>{const response=await fetch(`https://cdn.judge.me/api/v1/widgets/${endpoint}?${params}`,{signal:AbortSignal.any([request.signal,AbortSignal.timeout(6000)])});if(!response.ok)throw new Error('Review service unavailable');return response.json();};
  const [result,badge]=await Promise.all([read('product_review'),read('preview_badge')]) as [{reviews:PublishedReview[];total_pages:number;current_page:number},{badge:string}];
  const count=Number(badge.badge.match(/data-number-of-reviews=['"](\d+)/)?.[1]||0),rating=Number(badge.badge.match(/data-average-rating=['"]([\d.]+)/)?.[1]||0);
  if(!Array.isArray(result.reviews))throw new Error('Invalid reviews');
  const value={count,rating,page:result.current_page||page,pages:result.total_pages||1,reviews:result.reviews.map(review=>({id:review.uuid,title:review.title,rating:review.rating,body:review.body,name:review.reviewer_name,verified:review.verified_buyer,date:review.created_at}))};
  if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+120_000,value});
  return Response.json(value,{headers:{'Cache-Control':'public, max-age=120'}});
 }catch{return Response.json({error:'Customer reviews are temporarily unavailable.'},{status:503});}
}
