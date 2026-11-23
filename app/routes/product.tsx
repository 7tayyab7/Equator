import {takeEarlyAdd} from '../lib/early-add';
import {loadPublishedReviews} from '../lib/review-reader.server';
import {getProductPairings} from '../lib/pairing.server';
import {cardFields,toCard} from '../lib/product.server';
import type {ReviewData} from '../components/ProductReviews';
import {seoLoader} from '../lib/seo-redirects.server';
import {ProductPairings} from '../components/ProductPairings';
import {BaadmayWidget} from '../components/BaadmayWidget';
import {ArrowIcon} from '../components/ArrowIcon';
import {ProductReviews,useProductReviews} from '../components/ProductReviews';
import {ProductOptionSelect} from '../components/ProductOptionSelect';
import {Suspense,useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {Await,Link,isRouteErrorResponse,useLoaderData,useRouteError,useSearchParams,useNavigation,type ShouldRevalidateFunctionArgs} from 'react-router';
import type {Route} from './+types/product';
import {environmentContext} from '../storefront.context';
import {getProductInitial} from '../lib/product.server';
import {initialProductVariant,variantForOption,type Money} from '../lib/product-helpers';
import {ProductColors} from '../components/ProductColors';
import {ProductGallery} from '../components/ProductGallery';
import {KiwiSizeGuide} from '../components/KiwiSizeGuide';
import {ProductRail,RecentlyViewed} from '../components/ProductRail';
import {useCart} from '../components/CartProvider';

export async function loader({params,context,request}:Route.LoaderArgs){const env=context.get(environmentContext),data=await seoLoader(env,request,()=>getProductInitial(env,params.handle,request.signal));const reviews=loadPublishedReviews(new Request(new URL('/resources/product-reviews?id='+encodeURIComponent(data.product.id),request.url),{signal:request.signal})).then(async response=>response.ok?await response.json() as ReviewData:null).catch(()=>null);const pairings=getProductPairings(env,data.product,cardFields,request.signal).then(products=>products.map(toCard)).catch(()=>[]);return {...data,reviews,pairings};}
export function shouldRevalidate({currentParams,nextParams,defaultShouldRevalidate}:ShouldRevalidateFunctionArgs){return currentParams.handle!==nextParams.handle?defaultShouldRevalidate:false;}
function money(value:Money){return new Intl.NumberFormat('en-PK',{style:'currency',currency:value.currencyCode,maximumFractionDigits:0}).format(Number(value.amount));}
function Accordion({title,children,open,onToggle}:{title:string;children:ReactNode;open:boolean;onToggle:()=>void}){
 const id=useId();return <div className="pdp-accordion" data-open={open}><h2><button aria-expanded={open} aria-controls={id} onClick={onToggle}>{title}<span aria-hidden="true">{open?'−':'+'}</span></button></h2><div id={id} className="pdp-accordion-reveal" inert={!open}><div><div className="pdp-prose">{children}</div></div></div></div>;
}
// Only plain text from the legacy theme is used; Shopify's product/page HTML is merchant content.
function legacyText(html:string){return html.replace(/<br\s*\/?\s*>|<\/p>|<\/li>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();}
export default function ProductPage(){const data=useLoaderData<typeof loader>();return <ProductDetail key={data.product.id} data={data}/>;}
function ProductDetail({data}:{data:Awaited<ReturnType<typeof loader>>}){
 const {product:primaryProduct,secondary,descriptionHtml,details}=data;
 const [extras,setExtras]=useState<Awaited<typeof secondary>|null>(null);
 useEffect(()=>{let active=true;void secondary.then(value=>{if(active)setExtras(value);});return()=>{active=false;};},[secondary]);
 const product={...primaryProduct,gallery:{nodes:extras?.gallery||primaryProduct.gallery.nodes}};
 const addButton=useRef<HTMLButtonElement>(null),[showMobileBuy,setShowMobileBuy]=useState(true);
 useEffect(()=>{const button=addButton.current;if(!button)return;const observer=new IntersectionObserver(entries=>setShowMobileBuy(!entries[0].isIntersecting));observer.observe(button);return()=>observer.disconnect();},[]);
 const [openAccordion,setOpenAccordion]=useState<string|null>(null);
 const accordion=(title:string)=>({title,open:openAccordion===title,onToggle:()=>setOpenAccordion(current=>current===title?null:title)});
 const [params,setParams]=useSearchParams();const navigation=useNavigation();
 const selectionPending=navigation.state!=='idle'&&navigation.location?.pathname===`/products/${product.handle}`;
 const selectedParams=selectionPending?new URLSearchParams(navigation.location?.search):params;
 const variant=initialProductVariant(product.variants.nodes,selectedParams.get('variant'));
 const selection=useRef(variant);selection.current=variant;
 const {ready,busy,update,error,message,openBag,checkout}=useCart();const [added,setAdded]=useState(false),[shareMessage,setShareMessage]=useState('');
 const [hydrated,setHydrated]=useState(false);useEffect(()=>setHydrated(true),[]);
 // A tap made before the page was ready runs now, through the normal add (validation, cart, pixels unchanged).
 useEffect(()=>{if(takeEarlyAdd(product.id))void add();},[]);
 useEffect(()=>setAdded(false),[params]);
 const price=variant?.price||product.priceRange.minVariantPrice;
 function choose(name:string,value:string){const next=variantForOption(product.variants.nodes,selection.current?.selectedOptions||[],name,value);if(next){selection.current=next;const nextParams=new URLSearchParams(params);nextParams.set('variant',next.id.split('/').pop()!);setParams(nextParams,{preventScrollReset:true});}}
 async function add(){const chosen=selection.current;if(!chosen?.availableForSale)return;const added=await update({action:'add',variant:chosen.id,quantity:'1'});setAdded(added);return added;}
 // One state for every purchase button (main, mobile bar, Buy it now).
 const purchaseDisabled=busy||selectionPending||!variant?.availableForSale||!product.availableForSale;
 const addButtonText=!product.availableForSale||variant&&!variant.availableForSale?'Sold out':!variant?'Select size':selectionPending?'Updating selection…':busy?'Adding…':'Add to bag';
 async function share(){try{await navigator.clipboard.writeText(location.href);setShareMessage('Product link copied.');}catch{setShareMessage('Copy this page’s address to share this product.');}}
 return <>
 <article className="pdp" aria-label={product.title}>
  <Suspense fallback={<ProductGallery images={product.gallery.nodes} title={product.title}/>}><Await resolve={secondary} errorElement={<ProductGallery images={product.gallery.nodes} title={product.title}/>}>{extras=><ProductGallery images={extras.gallery} title={product.title}/>}</Await></Suspense>
  <div className="pdp-information-column"><div className="pdp-information">
   <Link to="/" className="pdp-brand"><img src="/images/equator-wordmark-2026.png" alt="Equator" width="1785" height="316"/></Link>
   <h1>{product.title}</h1><div className="pdp-price">{variant?.compareAtPrice&&Number(variant.compareAtPrice.amount)>Number(price.amount)&&<del>{money(variant.compareAtPrice)}</del>} <span>{money(price)}</span>{variant?.sku?.trim()&&<p className="pdp-sku">SKU: {variant.sku}</p>}</div>
   <BaadmayWidget price={price}/>
   <Suspense fallback={null}><Await resolve={data.reviews} errorElement={null}>{review=>review&&<a className="pdp-review-summary" href="#customer-reviews">{review.count?`${review.rating.toFixed(1)} / 5 · ${review.count} ${review.count===1?'review':'reviews'}`:'No reviews yet'}</a>}</Await></Suspense>
   <div className={`pdp-selectors ${(extras?.colors.length||0)>1?'':'pdp-selectors-single'}`}><Suspense fallback={null}><Await resolve={secondary} errorElement={null}>{extras=>extras.colors.length>1?<ProductColors colors={extras.colors} handle={product.handle}/>:null}</Await></Suspense>
    <div className="pdp-options">{product.options.map(option=><ProductOptionSelect key={option.name} name={option.name} disabled={!hydrated} value={variant?.selectedOptions.find(o=>o.name===option.name)?.value||''} onChange={value=>choose(option.name,value)} options={option.optionValues.map(value=>({value:value.name,available:product.variants.nodes.some(v=>v.availableForSale&&v.selectedOptions.some(o=>o.name===option.name&&o.value===value.name))}))}/>)}<KiwiSizeGuide product={product} variantID={variant?.id||""} sku={variant?.sku||""} selectionPending={selectionPending} onAdd={add} onVariantChange={id=>{const next=product.variants.nodes.find(value=>value.id===id);if(next){selection.current=next;const nextParams=new URLSearchParams(params);nextParams.set('variant',id.split('/').pop()!);setParams(nextParams,{preventScrollReset:true});}}}/></div>
   </div>
   {product.options.filter(option=>/^size$/i.test(option.name)).map(option=>{const soldOut=option.optionValues.filter(value=>!product.variants.nodes.some(v=>v.availableForSale&&v.selectedOptions.some(o=>o.name===option.name&&o.value===value.name)));return soldOut.length?<p className="pdp-size-availability" key={option.name}>Sold-out sizes: {soldOut.map(value=><span key={value.name}>{value.name}</span>)}</p>:null;})}
   <button ref={addButton} className="pdp-add" data-add-to-bag={product.id} onClick={()=>void add()} disabled={purchaseDisabled}>{addButtonText}</button>
   <button className="pdp-buy-now" onClick={()=>{if(variant?.availableForSale)void checkout(variant.id);}} disabled={purchaseDisabled}>{busy?'Please wait…':'Buy it now'}</button>
   <p className="pdp-feedback" role={error?'alert':'status'}>{error||(added?message:'')}</p>
   {added&&<button className="pdp-view-bag" onClick={openBag}>View bag <ArrowIcon/></button>}
   <div className="pdp-description pdp-prose" dangerouslySetInnerHTML={{__html:descriptionHtml}}/>
   <div className="pdp-accordions">
    {details.length>0&&<Accordion {...accordion('Details')}><dl className="pdp-detail-list">{details.map((detail,index)=><div key={`${detail.label}:${index}`}>{detail.label&&<dt>{detail.label}:</dt>}<dd>{detail.value}</dd></div>)}</dl></Accordion>}
    <Accordion {...accordion('Customer Care')}><Suspense fallback={<p role="status">Loading customer care…</p>}><Await resolve={secondary} errorElement={null}>{({care})=>care?<p className="pdp-preserve-lines">{legacyText(care)}</p>:<p>For product and order assistance, <a href="https://equatorstores.com/pages/contact">contact Equator Customer Care</a>.</p>}</Await></Suspense></Accordion>
    <Accordion {...accordion('Shipping & Returns')}><Suspense fallback={<p role="status">Loading shipping information…</p>}><Await resolve={secondary} errorElement={null}>{({shipping,returns})=><>{shipping&&<><h3>Shipping</h3><div dangerouslySetInnerHTML={{__html:shipping}}/></>}{returns&&<><h3>Returns & Exchanges</h3><div dangerouslySetInnerHTML={{__html:returns}}/></>}<p><a href="https://equatorstores.com/pages/shipping-policy" target="_blank" rel="noopener noreferrer">Shipping policy <ArrowIcon direction="up-right"/></a><br/><a href="https://equatorstores.com/pages/return-exchange-policy" target="_blank" rel="noopener noreferrer">Return & exchange policy <ArrowIcon direction="up-right"/></a></p></>}</Await></Suspense></Accordion>
    <Accordion {...accordion('Share')}><button className="pdp-share" onClick={()=>void share()}>Copy product link</button><p role="status">{shareMessage}</p></Accordion>
   </div>
  </div></div>
 </article>
 {showMobileBuy&&<div className="pdp-mobile-buybar"><div><span>{product.title}</span><strong>{money(price)}{variant&&` · ${variant.selectedOptions.map(o=>o.value).join(' / ')}`}</strong></div><button className="pdp-add" data-add-to-bag={product.id} aria-label="Add selected size to bag" onClick={()=>void add()} disabled={purchaseDisabled}>{addButtonText}</button></div>}
 <Suspense fallback={<section className="product-reviews" aria-busy="true"><h2>Customer reviews</h2><p role="status">Loading customer reviews…</p></section>}><Await resolve={data.reviews} errorElement={null}>{initial=><DeferredReviews productId={product.id} productTitle={product.title} initial={initial}/>}</Await></Suspense>
 <Suspense fallback={<section className="pdp-rail" aria-busy="true"><h2>Pair It With</h2><p role="status">Finding pieces to complete your look…</p></section>}><Await resolve={data.pairings} errorElement={null}>{products=><ProductRail title="Pair It With" products={products}/>}</Await></Suspense><Suspense fallback={<section className="pdp-rail" aria-busy="true"><h2>You May Also Like</h2><p role="status">Loading products…</p></section>}><Await resolve={secondary} errorElement={null}>{extras=><ProductRail title="You May Also Like" products={extras.related}/>}</Await></Suspense><RecentlyViewed current={product.id}/>
 </>;
}
function DeferredReviews({productId,productTitle,initial}:{productId:string;productTitle:string;initial:ReviewData|null}){const state=useProductReviews(productId,initial);return <ProductReviews state={state} productId={productId} productTitle={productTitle}/>;}
export {PageError as ErrorBoundary} from '../components/PageError';
