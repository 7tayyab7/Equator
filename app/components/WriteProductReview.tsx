import {useId,useRef,useState,type ReactNode,type FormEvent} from 'react';
import {requestJSON,JsonRequestTimeoutError} from '../lib/json-request.client';

export function WriteProductReview({productId,productTitle,summary}:{productId:string;productTitle:string;summary?:ReactNode}){
 const id=useId(),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),pending=useRef(false);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending.current)return;
  const form=event.currentTarget;pending.current=true;setBusy(true);setError('');
  try{
   const fields=new FormData(form),payload=new URLSearchParams();fields.forEach((value,key)=>{if(typeof value==='string')payload.append(key,value);});
   const {response,data:result}=await requestJSON<{message?:string;error?:string}>('/resources/product-reviews',{method:'POST',body:payload});
   if(!response.ok||!result.message)throw new Error(result.error||'We could not confirm the submission. Please check your email before trying again.');
   setMessage(result.message);form.reset();
  }catch(error){setError(error instanceof JsonRequestTimeoutError?'We could not confirm the submission. Please check your email before trying again.':error instanceof Error?error.message:'We could not confirm the submission. Please check your email before trying again.');}
  finally{pending.current=false;setBusy(false);}
 }
 return <div className="write-review">
  <div className="review-heading-row"><div>{summary}</div><button className="write-review-toggle" type="button" disabled={busy} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{open?'Close review form':'Write a review'}</button></div>
  {open&&<div id={id} className="write-review-panel">{message?<p role="status">{message}</p>:<form onSubmit={submit} aria-label={`Write a review for ${productTitle}`} aria-busy={busy}>
   <h3>Write a review for {productTitle}</h3>
   <input type="hidden" name="id" value={productId}/>
   <fieldset disabled={busy}><legend>Your rating</legend><div className="review-rating">{[1,2,3,4,5].map(value=><label key={value}><input type="radio" name="rating" value={value} required/><span>{value} {value===1?'star':'stars'}</span></label>)}</div></fieldset>
   <label>Your name<input name="name" autoComplete="name" maxLength={100} required disabled={busy}/></label>
   <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy}/></label>
   <label>Review title (optional)<input name="title" maxLength={200} disabled={busy}/></label>
   <label>Your review<textarea name="body" rows={5} maxLength={5000} required disabled={busy}/></label>
   <div className="review-honeypot" aria-hidden="true"><label>Leave this blank<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
   <p className="review-privacy">Your name, email, rating and review are sent to Judge.me to process your review. Your email is not displayed publicly. Reviews follow Equator’s existing moderation settings.</p>
   {error&&<p role="alert">{error}</p>}
   <button className="write-review-submit" type="submit" disabled={busy}>{busy?'Submitting…':'Submit review'}</button>
  </form>}</div>}
 </div>;
}
