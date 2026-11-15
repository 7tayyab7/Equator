import {seoLoader} from '../lib/seo-redirects.server';
import {ProductPairings} from '../components/ProductPairings';
import {BaadmayWidget} from '../components/BaadmayWidget';
import {ArrowIcon} from '../components/ArrowIcon';
import {ProductReviews,useProductReviews} from '../components/ProductReviews';
import {ProductOptionSelect} from '../components/ProductOptionSelect';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {Link,isRouteErrorResponse,useLoaderData,useRouteError,useSearchParams,useNavigation,type ShouldRevalidateFunctionArgs} from 'react-router';
import type {Route} from './+types/product';
import {environmentContext} from '../storefront.context';
import {getProduct} from '../lib/product.server';
import {initialProductVariant,variantForOption,type Money} from '../lib/product-helpers';
import {ProductColors} from '../components/ProductColors';
import {ProductGallery} from '../components/ProductGallery';
import {KiwiSizeGuide} from '../components/KiwiSizeGuide';
import {ProductRail,RecentlyViewed} from '../components/ProductRail';
import {useCart} from '../components/CartProvider';

export async function loader({params,context,request}:Route.LoaderArgs){return seoLoader(context.get(environmentContext),request,()=>getProduct(context.get(environmentContext),params.handle,request.signal));}
export function shouldRevalidate({currentParams,nextParams,defaultShouldRevalidate}:ShouldRevalidateFunctionArgs){return currentParams.handle!==nextParams.handle?defaultShouldRevalidate:false;}
function money(value:Money){return new Intl.NumberFormat('en-PK',{style:'currency',currency:value.currencyCode,maximumFractionDigits:0}).format(Number(value.amount));}
function Accordion({title,children,open,onToggle}:{title:string;children:ReactNode;open:boolean;onToggle:()=>void}){
 const id=useId();return <div className="pdp-accordion" data-open={open}><h2><button aria-expanded={open} aria-controls={id} onClick={onToggle}>{title}<span aria-hidden="true">{open?'−':'+'}</span></button></h2><div id={id} className="pdp-accordion-reveal" inert={!open}><div><div className="pdp-prose">{children}</div></div></div></div>;
}
// Only plain text from the legacy theme is used; Shopify's product/page HTML is merchant content.
function legacyText(html:string){return html.replace(/<br\s*\/?\s*>|<\/p>|<\/li>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();}
export default function ProductPage(){const data=useLoaderData<typeof loader>();return <ProductDetail key={data.product.id} data={data}/>;}
function ProductDetail({data}:{data:Awaited<ReturnType<typeof loader>>}){
 const {product,colors,pair,related,care,shipping,returns,descriptionHtml,details}=data;const reviews=useProductReviews(product.id);
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
 useEffect(()=>setAdded(false),[params]);
 const price=variant?.price||product.priceRange.minVariantPrice;
 function choose(name:string,value:string){const next=variantForOption(product.variants.nodes,selection.current?.selectedOptions||[],name,value);if(next){selection.current=next;const nextParams=new URLSearchParams(params);nextParams.set('variant',next.id.split('/').pop()!);setParams(nextParams,{preventScrollReset:true});}}
 async function add(){const chosen=selection.current;if(!chosen?.availableForSale)return;const added=await update({action:'add',variant:chosen.id,quantity:'1'});setAdded(added);return added;}
 async function share(){try{await navigator.clipboard.writeText(location.href);setShareMessage('Product link copied.');}catch{setShareMessage('Copy this page’s address to share this product.');}}
 return <>
 <article className="pdp" aria-label={product.title}>
  <ProductGallery images={product.gallery.nodes} title={product.title}/>
  <div className="pdp-information-column"><div className="pdp-information">
   <Link to="/" className="pdp-brand"><img src="/images/equator-wordmark-2026.png" alt="Equator" width="1785" height="316"/></Link>
   <h1>{product.title}</h1><div className="pdp-price">{variant?.compareAtPrice&&Number(variant.compareAtPrice.amount)>Number(price.amount)&&<del>{money(variant.compareAtPrice)}</del>} <span>{money(price)}</span>{variant?.sku?.trim()&&<p className="pdp-sku">SKU: {variant.sku}</p>}</div>
   <BaadmayWidget price={price}/>
   {reviews.data&&<a className="pdp-review-summary" href="#customer-reviews">{reviews.data.count?`${reviews.data.rating.toFixed(1)} / 5 · ${reviews.data.count} ${reviews.data.count===1?'review':'reviews'}`:'No reviews yet'}</a>}
   <div className={`pdp-selectors ${colors.length>1?'':'pdp-selectors-single'}`}>{colors.length>1&&<ProductColors colors={colors} handle={product.handle}/>}
    <div className="pdp-options">{product.options.map(option=><ProductOptionSelect key={option.name} name={option.name} disabled={!hydrated} value={variant?.selectedOptions.find(o=>o.name===option.name)?.value||''} onChange={value=>choose(option.name,value)} options={option.optionValues.map(value=>({value:value.name,available:product.variants.nodes.some(v=>v.availableForSale&&v.selectedOptions.some(o=>o.name===option.name&&o.value===value.name))}))}/>)}<KiwiSizeGuide product={product} variantID={variant?.id||""} sku={variant?.sku||""} selectionPending={selectionPending} onAdd={add} onVariantChange={id=>{const next=product.variants.nodes.find(value=>value.id===id);if(next){selection.current=next;const nextParams=new URLSearchParams(params);nextParams.set('variant',id.split('/').pop()!);setParams(nextParams,{preventScrollReset:true});}}}/></div>
   </div>
   {product.options.filter(option=>/^size$/i.test(option.name)).map(option=>{const soldOut=option.optionValues.filter(value=>!product.variants.nodes.some(v=>v.availableForSale&&v.selectedOptions.some(o=>o.name===option.name&&o.value===value.name)));return soldOut.length?<p className="pdp-size-availability" key={option.name}>Sold-out sizes: {soldOut.map(value=><span key={value.name}>{value.name}</span>)}</p>:null;})}
   <button ref={addButton} className="pdp-add" onClick={()=>void add()} disabled={!ready||busy||selectionPending||!variant?.availableForSale||!product.availableForSale}>{!product.availableForSale||variant&&!variant.availableForSale?'Sold out':!variant?'Select size':selectionPending?'Updating selection…':busy?'Adding…':'Add to bag'}</button>
   <button className="pdp-buy-now" onClick={()=>{if(variant?.availableForSale)void checkout(variant.id);}} disabled={!ready||busy||selectionPending||!variant?.availableForSale||!product.availableForSale}>{busy?'Please wait…':'Buy it now'}</button>
   <p className="pdp-feedback" role={error?'alert':'status'}>{error||(added?message:'')}</p>
   {added&&<button className="pdp-view-bag" onClick={openBag}>View bag <ArrowIcon/></button>}
   <div className="pdp-description pdp-prose" dangerouslySetInnerHTML={{__html:descriptionHtml}}/>
   <div className="pdp-accordions">
    {details.length>0&&<Accordion {...accordion('Details')}><dl className="pdp-detail-list">{details.map((detail,index)=><div key={`${detail.label}:${index}`}>{detail.label&&<dt>{detail.label}:</dt>}<dd>{detail.value}</dd></div>)}</dl></Accordion>}
    <Accordion {...accordion('Customer Care')}>{care?<p className="pdp-preserve-lines">{legacyText(care)}</p>:<p>For product and order assistance, <a href="https://equatorstores.com/pages/contact">contact Equator Customer Care</a>.</p>}</Accordion>
    <Accordion {...accordion('Shipping & Returns')}>{shipping&&<><h3>Shipping</h3><div dangerouslySetInnerHTML={{__html:shipping}}/></>}{returns&&<><h3>Returns & Exchanges</h3><div dangerouslySetInnerHTML={{__html:returns}}/></>}<p><a href="https://equatorstores.com/pages/shipping-policy" target="_blank" rel="noopener noreferrer">Shipping policy <ArrowIcon direction="up-right"/></a><br/><a href="https://equatorstores.com/pages/return-exchange-policy" target="_blank" rel="noopener noreferrer">Return & exchange policy <ArrowIcon direction="up-right"/></a></p></Accordion>
    <Accordion {...accordion('Share')}><button className="pdp-share" onClick={()=>void share()}>Copy product link</button><p role="status">{shareMessage}</p></Accordion>
   </div>
  </div></div>
 </article>
 {showMobileBuy&&<div className="pdp-mobile-buybar"><div><span>{product.title}</span><strong>{money(price)}{variant&&` · ${variant.selectedOptions.map(o=>o.value).join(' / ')}`}</strong></div><button className="pdp-add" aria-label="Add selected size to bag" onClick={()=>void add()} disabled={!ready||busy||selectionPending||!variant?.availableForSale||!product.availableForSale}>{!product.availableForSale||variant&&!variant.availableForSale?'Sold out':!variant?'Select size':selectionPending?'Updating selection…':busy?'Adding…':'Add to bag'}</button></div>}
 <ProductReviews state={reviews} productId={product.id} productTitle={product.title}/>
 <ProductPairings handle={product.handle}/><ProductRail title="You May Also Like" products={related}/><RecentlyViewed current={product.id}/>
 </>;
}
export function ErrorBoundary(){const error=useRouteError();return <div className="collection-error"><h1>{isRouteErrorResponse(error)&&error.status===404?'Product not found':'Product temporarily unavailable'}</h1><p>Please try again or explore our collections.</p><Link to="/collections/new-arrivals">Shop new arrivals</Link></div>;}
