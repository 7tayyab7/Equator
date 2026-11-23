import {recordConfirmedCart,recordCartViewed} from '../lib/tracking.client';
import {CartSuggestions} from './CartSuggestions';
import {responsiveImage} from '../lib/images';
import {createContext,useContext,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {Link} from 'react-router';
import type {Cart} from '../lib/cart.server';
import {requestJSON,JsonRequestTimeoutError} from '../lib/json-request.client';
type CartResponse={cart:Cart|null;error?:string;warnings?:string[]};
type State={checkout:(variant:string)=>Promise<void>;cart:Cart|null;ready:boolean;busy:boolean;error:string;message:string;openBag:()=>void;bagRequest:number;update:(input:Record<string,string>)=>Promise<boolean>};
const Context=createContext<State|null>(null);
export function CartProvider({children}:{children:ReactNode}){
 const [bagRequest,setBagRequest]=useState(0);
 const [cart,setCart]=useState<Cart|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');const lock=useRef(false);
 const initialLoad=useRef<AbortController|null>(null);
 useEffect(()=>{const controller=new AbortController();initialLoad.current=controller;requestJSON<CartResponse>('/resources/cart',{signal:controller.signal}).then(({data})=>{if(controller.signal.aborted)return;setCart(data.cart||null);setError(data.error||'');setReady(true);}).catch(()=>{if(!controller.signal.aborted){setError('Your bag could not be loaded. Please refresh this page.');setReady(true);}});return()=>controller.abort();},[]);
 async function update(input:Record<string,string>){if(lock.current)return false;lock.current=true;
  // The bag may still be loading: the server reads it from the cookie, so the add goes ahead and the slower first load is dropped.
  if(!ready){initialLoad.current?.abort();setReady(true);}
  const pending=requestJSON<CartResponse>('/resources/cart',{method:'POST',body:new URLSearchParams(input)});setBusy(true);setError('');setMessage('');try{const {response,data}=await pending;if(!response.ok)throw new Error(data.error||'Unable to update your bag.');recordConfirmedCart(cart,data.cart);setCart(data.cart);setMessage(data.warnings?.join(' ')||(input.action==='discount'?(input.code?(data.cart?.discountCodes.some(code=>code.applicable)?'Discount applied.':'This discount code is not applicable to the items in your bag.'):'Discount removed.'):input.action==='add'?'Added to your bag.':'Bag updated.'));if(input.action==='add')setBagRequest(value=>value+1);return true;}catch(e){setError(e instanceof JsonRequestTimeoutError?'We could not confirm the update. Refresh your bag before trying again.':e instanceof Error?e.message:'Unable to update your bag.');return false;}finally{lock.current=false;setBusy(false);}}
 async function checkout(variant:string){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const {response,data}=await requestJSON<{checkoutUrl?:string;error?:string}>('/resources/cart',{method:'POST',body:new URLSearchParams({action:'buy',variant,quantity:'1'})});if(!response.ok||!data.checkoutUrl)throw new Error(data.error||'Checkout could not be started.');window.location.assign(data.checkoutUrl);}catch(e){setError(e instanceof JsonRequestTimeoutError?'We could not confirm checkout. Check your bag before trying again.':e instanceof Error?e.message:'Checkout could not be started.');}finally{lock.current=false;setBusy(false);}}
 return <Context value={{checkout,cart,ready,busy,error,message,update,bagRequest,openBag:()=>setBagRequest(value=>value+1)}}>{children}</Context>;
}
export function useCart(){const value=useContext(Context);if(!value)throw new Error('CartProvider is missing');return value;}
/** Adds one preconnect (plus dns-prefetch fallback) for the checkout host; repeated calls are ignored. */
export function preconnectCheckout(checkoutUrl:string){
 if(typeof document==='undefined')return;let origin:string;try{origin=new URL(checkoutUrl).origin;}catch{return;}
 if(!origin.startsWith('https://')||document.querySelector(`link[rel="preconnect"][href="${origin}"]`))return;
 for(const rel of ['preconnect','dns-prefetch']){const link=document.createElement('link');link.rel=rel;link.href=origin;document.head.appendChild(link);}// No crossorigin: the checkout is a page navigation, which only reuses a credentialed connection.
}
export function BagContents({close,continueShopping=close}:{close:()=>void;continueShopping?:()=>void}){
 const {cart,ready,busy,error,message,update}=useCart();const [discount,setDiscount]=useState('');const discountID=useId();
 // Checkout opens Shopify's hosted checkout, which can take a few seconds: the bag stays open and says so meanwhile.
 const [redirecting,setRedirecting]=useState(false);
 useEffect(()=>{const reset=(event:PageTransitionEvent)=>{if(event.persisted)setRedirecting(false);};window.addEventListener('pageshow',reset);return()=>window.removeEventListener('pageshow',reset);},[]);
 // Shopify's checkout runs on its own host; connecting while the bag is open saves the DNS/TLS setup (~1 s) on Checkout.
 useEffect(()=>{if(cart?.totalQuantity&&cart.checkoutUrl)preconnectCheckout(cart.checkoutUrl);},[cart?.checkoutUrl,cart?.totalQuantity]);
 useEffect(()=>{if(ready&&cart?.totalQuantity)recordCartViewed(cart);},[ready]);
 if(!ready)return <p role="status">Loading your bag…</p>;
 const format=(amount:{amount:string;currencyCode:string})=>new Intl.NumberFormat('en-PK',{style:'currency',currency:amount.currencyCode,maximumFractionDigits:0}).format(Number(amount.amount));
 return <div className="pdp-bag">
  <div className="pdp-bag-scroll"><p className="pdp-bag-error" role="alert">{error}</p><p className="pdp-bag-message" role="status">{message}</p>
   {!cart?.totalQuantity?<div className="empty-bag"><p>Your bag is empty.</p><button className="nav-type solid-button" onClick={continueShopping}>Continue shopping</button></div>:<div className="pdp-bag-lines">{cart.lines.nodes.map(line=><div className="pdp-bag-line" key={line.id}>
    <Link className="pdp-bag-image" to={`/products/${line.merchandise.product.handle}?variant=${line.merchandise.id.split('/').pop()}`} onClick={close}>{line.merchandise.image&&<img {...responsiveImage(line.merchandise.image.url,160,[80,160,240],'(max-width:767px) 64px, 80px')} decoding="async" alt={line.merchandise.image.altText||line.merchandise.product.title} width="80" height="120"/>}</Link>
    <div className="pdp-bag-copy"><Link to={`/products/${line.merchandise.product.handle}?variant=${line.merchandise.id.split('/').pop()}`} onClick={close}>{line.merchandise.product.title}</Link><p>{line.merchandise.title}</p>
     <div className="pdp-bag-quantity"><span>Qty:</span><button aria-label={`Decrease quantity for ${line.merchandise.product.title}`} disabled={busy||line.quantity<=1} onClick={()=>void update({action:'update',line:line.id,quantity:String(line.quantity-1)})}>−</button><input aria-label={`Quantity for ${line.merchandise.product.title}`} type="number" min="1" max="99" value={line.quantity} disabled={busy} onChange={e=>{const quantity=e.target.value;if(quantity!==''&&Number.isInteger(Number(quantity))&&Number(quantity)>=1)void update({action:'update',line:line.id,quantity});}}/><button aria-label={`Increase quantity for ${line.merchandise.product.title}`} disabled={busy||line.quantity>=99} onClick={()=>void update({action:'update',line:line.id,quantity:String(line.quantity+1)})}>+</button></div>
    </div><div className="pdp-bag-line-end"><p>{format(line.cost.totalAmount)}</p><button disabled={busy} onClick={()=>void update({action:'update',line:line.id,quantity:'0'})}>Remove</button></div>
   </div>)}</div>}
   {!!cart?.totalQuantity&&<CartSuggestions handles={[...new Set(cart.lines.nodes.map(line=>line.merchandise.product.handle))].join(',')} close={close}/>}
  </div>
  {!!cart?.totalQuantity&&<div className="pdp-bag-summary"><p className="pdp-bag-total">Subtotal <span>{format(cart.cost.subtotalAmount)}</span></p><p className="pdp-bag-shipping">Shipping and taxes calculated at checkout. <Link to="/pages/shipping-policy" onClick={close}>Delivery policy</Link></p>
  <form className="bag-discount" onSubmit={event=>{event.preventDefault();if(discount.trim())void update({action:'discount',code:discount.trim(),quantity:'0'});}}><label htmlFor={discountID}>Discount code</label><div><input id={discountID} name="discount" value={discount} onChange={event=>setDiscount(event.target.value)} maxLength={100} placeholder="Enter code" disabled={busy}/><button disabled={busy||!discount.trim()}>Apply</button></div></form>
  {cart.discountCodes.map(code=><p className="bag-discount-status" key={code.code}>{code.code}: {code.applicable?'Applied':'Not applicable'} <button disabled={busy} onClick={()=>void update({action:'discount',code:'',quantity:'0'})}>Remove</button></p>)}
  {cart.discountCodes.some(code=>code.applicable)&&<p className="pdp-bag-total">Estimated total <span>{format(cart.cost.totalAmount)}</span></p>}<a className="solid-button nav-type bag-checkout" href={cart.checkoutUrl} data-keep-panel="" aria-busy={redirecting||undefined} aria-disabled={redirecting||undefined} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.button!==0)return;if(redirecting){event.preventDefault();return;}setRedirecting(true);}}>{redirecting?'Redirecting to checkout…':'Checkout'}</a><button className="solid-button nav-type" onClick={continueShopping}>Continue shopping</button></div>}
 </div>;
}
