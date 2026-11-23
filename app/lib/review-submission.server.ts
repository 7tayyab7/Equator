/** Judge.me's unauthenticated web-review endpoint; never use a private API key here. */
export async function submitProductReview(request:Request,shop:string,send:typeof fetch=fetch){
 const headers={'Cache-Control':'private, no-store'};
 const reply=(body:object,status=200)=>Response.json(body,{status,headers});
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Please submit from this storefront.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return reply({error:'Invalid review form.'},415);
 if(Number(request.headers.get('Content-Length'))>32_000)return reply({error:'Review is too long.'},413);
 try{
  const raw=await request.text();if(raw.length>32_000)return reply({error:'Review is too long.'},413);
  const form=new URLSearchParams(raw),id=(form.get('id')||'').replace('gid://shopify/Product/',''),name=(form.get('name')||'').trim(),email=(form.get('email')||'').trim(),title=(form.get('title')||'').trim(),body=(form.get('body')||'').trim(),rating=Number(form.get('rating'));
  if(form.get('website'))return reply({error:'Review could not be submitted.'},400);
  if(!/^\d{5,16}$/.test(id)||!Number.isSafeInteger(Number(id))||!name||name.length>100||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!Number.isInteger(rating)||rating<1||rating>5||!body||body.length>5000||title.length>200)return reply({error:'Please enter your name, a valid email, a rating and a review (up to 5,000 characters).'},400);
  const response=await send('https://judge.me/api/v1/reviews',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({shop_domain:shop,platform:'shopify',id:Number(id),name,email,rating,title,body}),signal:AbortSignal.timeout(15_000)});
  if(!response.headers.get('Content-Type')?.includes('application/json'))throw new Error('Unconfirmed vendor response');
  const result=await response.json().catch(()=>null) as {error?:unknown;errors?:unknown}|null;
  if(!response.ok||result?.error||result?.errors)return reply({error:'Judge.me could not accept this review. Please check your details or try again later.'},response.status===429?429:502);
  return reply({message:'Your review was sent to Judge.me. It will appear once processed according to Equator’s review settings. Please check your email for any confirmation request.'});
 }catch{return reply({error:'We could not confirm the submission. Please check your email before trying again to avoid sending the review twice.'},503);}
}
