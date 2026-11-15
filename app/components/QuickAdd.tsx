import {ArrowIcon} from './ArrowIcon';
import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router';
import {useCart} from './CartProvider';
import type {Variant} from '../lib/product-helpers';
import {quickAddLoader} from '../lib/quick-add.client';
export function QuickAdd({handle,title,onClose}:{handle:string;title:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),id=useId();const [variants,setVariants]=useState<Variant[]|null>(()=>quickAddLoader.read(handle)||null),[selected,setSelected]=useState(()=>quickAddLoader.read(handle)?.find(v=>v.availableForSale)?.id||''),[loadError,setLoadError]=useState(''),[attempt,setAttempt]=useState(0);
 const {ready,busy,error,update}=useCart();
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,node=dialog.current;node?.showModal();return()=>{node?.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 useEffect(()=>{let active=true;setLoadError('');void quickAddLoader.load(handle).then(next=>{if(active){setVariants(next);setSelected(value=>next.some(v=>v.id===value&&v.availableForSale)?value:next.find(v=>v.availableForSale)?.id||'');}}).catch(e=>{if(active)setLoadError(e instanceof Error?e.message:'Sizes could not be loaded.');});return()=>{active=false;};},[handle,attempt]);
 const variant=variants?.find(v=>v.id===selected);
 async function add(){if(!variant?.availableForSale)return;const added=await update({action:'add',variant:variant.id,quantity:'1'});quickAddLoader.invalidate(handle);if(added)onClose();}
 return <dialog className="quick-add-dialog" ref={dialog} aria-labelledby={id} onCancel={event=>{if(busy)event.preventDefault();else onClose();}} onClick={event=>{if(event.target===event.currentTarget&&!busy){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}>
  <button className="quick-add-close" type="button" onClick={onClose} disabled={busy} aria-label="Close quick add">×</button><h2 id={id}>{title}</h2>
  <div className="quick-add-content" aria-busy={!variants&&!loadError}>{loadError?<div role="alert"><p>{loadError}</p><button className="quick-add-retry" onClick={()=>setAttempt(value=>value+1)}>Try again</button></div>:!variants?<p role="status">Loading sizes…</p>:<><fieldset className="quick-add-sizes" disabled={busy}><legend>Select size</legend>{variants.map(v=><label key={v.id} data-unavailable={!v.availableForSale}><input type="radio" name={id} value={v.id} checked={selected===v.id} disabled={!v.availableForSale} onChange={()=>setSelected(v.id)}/><span>{v.selectedOptions.map(o=>o.value).join(' / ')}{!v.availableForSale?' · Sold out':''}</span></label>)}</fieldset>{variant&&<p className="quick-add-price">{new Intl.NumberFormat('en-PK',{style:'currency',currency:variant.price.currencyCode,maximumFractionDigits:0}).format(Number(variant.price.amount))}</p>}<button className="pdp-add" disabled={!ready||busy||!variant?.availableForSale} onClick={()=>void add()}>{busy?'Adding…':variants.some(v=>v.availableForSale)?'Add to bag':'Sold out'}</button></>}</div>
  {error&&<p role="alert">{error}</p>}<Link to={`/products/${handle}`} onClick={onClose}>View product details <ArrowIcon/></Link>
 </dialog>;
}
