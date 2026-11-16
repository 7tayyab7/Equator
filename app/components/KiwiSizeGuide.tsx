import {ArrowIcon} from './ArrowIcon';
import {useEffect,useId,useRef,useState} from 'react';
import type {Product} from '../lib/product.server';
import {responsiveImage} from '../lib/images';
import {useCart} from './CartProvider';
import {createKiwiLoader} from '../lib/kiwi-loader';

const loadKiwi=createKiwiLoader(()=>window,()=>document);

export function KiwiSizeGuide({product,variantID,sku,onVariantChange,onAdd,selectionPending=false}:{product:Product;variantID:string;sku:string;onVariantChange:(id:string)=>void;onAdd:()=>Promise<unknown>;selectionPending?:boolean}){
 const {ready,busy,error}=useCart();
 const selected=product.variants.nodes.find(value=>value.id===variantID);
 async function addFromGuide(){if(!selected?.availableForSale||busy)return;const added=await onAdd();if(added)setOpen(false);}
 const [open,setOpen]=useState(false),[enabled,setEnabled]=useState(false),[attempt,setAttempt]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
 const dialog=useRef<HTMLDialogElement>(null),mount=useRef<HTMLDivElement>(null),loaded=useRef('');
 const titleID=useId(),dialogID=useId();
 const opening=useRef(false);opening.current=open;
 const productID=product.id.split('/').pop()!;
 // A garment's measurements do not change when its purchase size changes.
 // Keep Kiwi's matching variant/SKU stable for this product mount.
 const chartSelection=useRef({variant:variantID.split('/').pop()||'',sku});
 const variant=chartSelection.current.variant,requestKey=productID;
 const productData=JSON.stringify({productID,title:product.title,images:product.gallery.nodes.map(image=>image.url),tags:product.tags.join(','),collections:product.collections.nodes.map(collection=>collection.id.split('/').pop()).join(','),vendor:product.vendor,type:product.productType,sku:chartSelection.current.sku});
 // Warm only this product's guide after its primary image, during idle time.
 // Explicit intent still starts immediately, including on data-saving networks.
 useEffect(()=>{
  if(enabled)return;
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(connection?.saveData||/^(slow-)?2g$/.test(connection?.effectiveType||''))return;
  let idle:number|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  const primary=document.querySelector<HTMLImageElement>('.pdp-gallery img');
  const schedule=()=>{if('requestIdleCallback' in window)idle=window.requestIdleCallback(()=>setEnabled(true),{timeout:1200});else timer=setTimeout(()=>setEnabled(true),200);};
  if(!primary||primary.complete)schedule();else{primary.addEventListener('load',schedule,{once:true});primary.addEventListener('error',schedule,{once:true});}
  return()=>{if(idle!==undefined)window.cancelIdleCallback(idle);if(timer)clearTimeout(timer);primary?.removeEventListener('load',schedule);primary?.removeEventListener('error',schedule);};
 },[enabled,productID]);
 useEffect(()=>{
  if(!open)return;
  mount.current?.querySelectorAll('img').forEach(image=>{image.fetchPriority='high';});
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  dialog.current?.showModal();dialog.current?.querySelector('.kiwi-guide-body')?.scrollTo({top:0});document.body.style.overflow='hidden';
  return()=>{dialog.current?.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
 },[open]);
 useEffect(()=>{
  const node=mount.current;if(!node||!enabled||loaded.current===requestKey&&node.querySelector('.ks-chart-tab-container'))return;
  let cancelled=false;loaded.current='';setStatus('loading');node.replaceChildren();
  const fail=()=>{if(!cancelled&&loaded.current!==requestKey)setStatus('unavailable');};
  // Kiwi marks snippet targets after discovery. Reset the owned target before
  // reinitializing it; an empty, previously marked target is otherwise skipped.
  node.className='';
  const detect=()=>{
   const chart=node.querySelector('.ks-chart-tab-container');
   const images=chart?Array.from(chart.querySelectorAll('img')):[];
   images.forEach((image,index)=>{
    if(!image.alt)image.alt=`${product.title} size chart ${index+1}, supplied by Equator`;
    // Native closed dialogs are display:none. Promote Kiwi's lazy sources so the
    // real chart can download before opening, instead of waiting for visibility.
    image.loading='eager';image.decoding='async';image.fetchPriority=opening.current?'high':'low';
    const source=image.getAttribute('data-src'),sourceSet=image.getAttribute('data-srcset');
    if(sourceSet&&image.getAttribute('srcset')!==sourceSet)image.srcset=sourceSet;
    if(source&&image.getAttribute('src')!==source)image.src=source;
   });
   const rendered=chart&&(chart.querySelector('table')||images.length&&images.every(image=>image.complete&&image.naturalWidth>0)||!images.length&&chart.textContent?.trim());
   if(!cancelled&&rendered){loaded.current=requestKey;setStatus('ready');}
  };
  const observer=new MutationObserver(detect);observer.observe(node,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});
  node.addEventListener('load',detect,true);
  // Retry a stalled SDK request once. Kiwi can mark an empty snippet as loaded
  // before its network request succeeds, so clear that marker for the retry.
  let retry:ReturnType<typeof setTimeout>|undefined;
  const timer=setTimeout(fail,22000);
  const start=(canRetry:boolean)=>void loadKiwi().then(api=>{
   if(cancelled)return;
   api.setShopID('equatorstores.myshopify.com');api.setLanguage('en');
   // The requested container is Kiwi's embedded-snippet target. Its data
   // attributes select inline rendering inside our accessible modal. Passing
   // a second injectionSelector would create an additional chart instance.
   api.loadSizing({productData:JSON.parse(productData),options:{},loaded:success=>{if(!success)fail();}});
   detect();
   if(canRetry)retry=setTimeout(()=>{
    if(cancelled||loaded.current===requestKey)return;
    // Existing chart markup may simply be waiting for its image. Do not tear it
    // down or request a duplicate chart in that case.
    if(node.querySelector('.ks-chart-tab-container'))return;
    node.className='';start(false);
   },6000);
  }).catch(()=>{if(cancelled)return;if(canRetry)retry=setTimeout(()=>start(false),300);else fail();});
  start(true);
  return()=>{cancelled=true;observer.disconnect();node.removeEventListener('load',detect,true);clearTimeout(timer);if(retry)clearTimeout(retry);};
 },[enabled,requestKey,productData,product.title,attempt]);
 return <>
  <link rel="preconnect" href="https://cdn.static.kiwisizing.com"/>
  <link rel="preconnect" href="https://app.kiwisizing.com"/>
  <link rel="preconnect" href="https://cdn.kiwisizing.com"/>
  <button type="button" className="pdp-size-guide kiwi-guide-trigger" aria-haspopup="dialog" aria-controls={dialogID} aria-expanded={open} onPointerEnter={()=>setEnabled(true)} onFocus={()=>setEnabled(true)} onTouchStart={()=>setEnabled(true)} onClick={()=>{setEnabled(true);if(status==='unavailable')setAttempt(value=>value+1);setOpen(true);}}>Size guide</button>
  <dialog id={dialogID} className="kiwi-guide-dialog" ref={dialog} aria-labelledby={titleID} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget){const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)setOpen(false);}}}>
   <header><h2 id={titleID}>Size guide</h2><button type="button" aria-label="Close size guide" onClick={()=>setOpen(false)}>×</button></header>
   <div className="kiwi-guide-body">
    <p className="kiwi-guide-product">{product.title}</p>
    {status==='loading'&&<p className="kiwi-guide-status" role="status">Loading size chart…</p>}
    <div key={requestKey} id="KiwiSizingChart" ref={mount} data-product={productID} data-variant={variant} data-display-mode="0" data-recommender-display-mode="0"/>
    <div className="kiwi-guide-photos">{product.gallery.nodes.slice(0,2).map((image,index)=><img key={image.url} {...responsiveImage(image.url,400,[200,400,600,800],'(max-width:767px) 40vw, 240px',image.width)} width={image.width} height={image.height} alt={`${product.title} — view ${index+1}`} loading="lazy" decoding="async"/>)}</div>
    {status==='unavailable'&&<div className="kiwi-guide-status" role="status"><p>The size chart could not be loaded here.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Try again</button><a href="https://wa.me/923334919028" target="_blank" rel="noopener noreferrer">Ask Equator for sizing help <ArrowIcon direction="up-right"/></a></div>}
   </div>
   <footer className="kiwi-guide-footer">
    <fieldset className="quick-add-sizes" disabled={!ready||busy||selectionPending}><legend>Select size</legend>{product.variants.nodes.map(value=><label key={value.id} data-unavailable={!value.availableForSale}><input type="radio" name={`${dialogID}-size`} checked={variantID===value.id} disabled={!value.availableForSale} onChange={()=>onVariantChange(value.id)}/><span>{value.selectedOptions.map(option=>option.value).join(' / ')}{!value.availableForSale?' · Sold out':''}</span></label>)}</fieldset>
    {error&&<p role="alert">{error}</p>}
    <div className="kiwi-guide-purchase"><strong>{selected&&new Intl.NumberFormat('en-PK',{style:'currency',currency:selected.price.currencyCode,maximumFractionDigits:0}).format(Number(selected.price.amount))}</strong><button className="pdp-add" onClick={()=>void addFromGuide()} disabled={!ready||busy||selectionPending||!selected?.availableForSale}>{busy?'Adding…':selectionPending?'Updating…':selected?.availableForSale?'Add to bag':'Sold out'}</button></div>
   </footer>
  </dialog>
 </>;
}
