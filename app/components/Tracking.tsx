import {ShopifyScripts} from '@shopify/hydrogen/react';
import {AnalyticsEvent,trackCartAnalytics,type AnalyticsCart} from '@shopify/hydrogen';
import {useEffect,useRef,useState} from 'react';
import {useLocation,useMatches,useNavigate,useRouteLoaderData} from 'react-router';
import {useCart} from './CartProvider';
import {activeTrackingConsent,initializeTracking,recordTracking,setupShopifyConsent,trackingLocation} from '../lib/tracking.client';
import {emptyConsent,eventValue,safeSearchTerm,safeTrackingURL,trackingItem,type TrackingConfig} from '../lib/tracking';

const consent={mode:'custom-banner' as const,setup:setupShopifyConsent};
export function TrackingHead(){const data=useRouteLoaderData('root') as {tracking:TrackingConfig}|undefined;const navigate=useNavigate();if(!data?.tracking.enabled)return null;const {shopId,storefrontId,myshopifyDomain}=data.tracking;return <ShopifyScripts shop={{shopId,storefrontId,myshopifyDomain}} i18n={{country:'PK',language:'EN',currency:'PKR'}} consent={consent} navigate={navigate} webMcp={false}/>;}

export function TrackingEvents({config}:{config:TrackingConfig}){
 const location=useLocation(),matches=useMatches(),{cart,ready}=useCart(),lastPage=useRef(''),lastResource=useRef(''),lastShopifyPage=useRef(''),lastShopifyResource=useRef(''),previousURL=useRef('');
 const [consentRevision,setConsentRevision]=useState(0);
 useEffect(()=>{initializeTracking(config);const onReady=()=>setConsentRevision(value=>value+1);document.addEventListener('equator:consent-ready',onReady);document.addEventListener('equator:consent-changed',onReady);return()=>{document.removeEventListener('equator:consent-ready',onReady);document.removeEventListener('equator:consent-changed',onReady);};},[config]);
 useEffect(()=>{const bus=window.Shopify?.analytics;if(!config.enabled||!bus||new URLSearchParams(location.search).get('tracking_debug')!=='1')return;return bus.addDestination({name:'equator-diagnostic',setup({subscribe}){for(const name of [AnalyticsEvent.PAGE_VIEWED,AnalyticsEvent.PRODUCT_VIEWED,AnalyticsEvent.COLLECTION_VIEWED])subscribe(name,()=>console.info(`[Equator tracking] ${name} delivered with Shopify consent`));}});},[config.enabled,location.search]);
 const match=matches.at(-1),data=match?.loaderData as any,pageKey=location.key+location.pathname+location.search;
 useEffect(()=>{
  const bus=config.enabled&&activeTrackingConsent().analytics?window.Shopify?.analytics:undefined;
  if(lastPage.current!==pageKey){lastPage.current=pageKey;let referrer:string|undefined;try{referrer=previousURL.current||(document.referrer?safeTrackingURL(document.referrer):undefined);}catch{}recordTracking({name:'page_view',page_location:trackingLocation(),page_title:document.title,page_referrer:referrer});previousURL.current=trackingLocation();}
  if(bus&&lastShopifyPage.current!==pageKey){lastShopifyPage.current=pageKey;bus.publish(AnalyticsEvent.PAGE_VIEWED,{url:trackingLocation()});}
  const resourceKey=pageKey+':'+(data?.product?.id||data?.collection?.id||data?.q||'');const record=lastResource.current!==resourceKey,publish=!!bus&&lastShopifyResource.current!==resourceKey;if(!record&&!publish)return;if(record)lastResource.current=resourceKey;if(publish)lastShopifyResource.current=resourceKey;
  if(data?.product){const p=data.product,variant=p.variants.nodes.find((v:any)=>v.id.split('/').pop()===new URLSearchParams(location.search).get('variant'))||p.variants.nodes.find((v:any)=>v.availableForSale)||p.variants.nodes[0];if(variant){const item=trackingItem(p,variant);if(item){if(record)recordTracking({name:'view_item',items:[item],currency:variant.price.currencyCode,value:eventValue([item])});if(publish)bus?.publish(AnalyticsEvent.PRODUCT_VIEWED,{url:trackingLocation(),products:[{id:p.id,title:p.title,vendor:p.vendor,variantId:variant.id,variantTitle:variant.title,price:variant.price,quantity:1,sku:variant.sku}]});}}}
  else if(data?.collection){if(record)recordTracking({name:'view_item_list',item_list_id:data.collection.id,item_list_name:data.collection.title});if(publish&&data.collection.id?.startsWith('gid://'))bus?.publish(AnalyticsEvent.COLLECTION_VIEWED,{url:trackingLocation(),collection:{id:data.collection.id,handle:data.collection.handle}});}
  else if(data?.q){const term=safeSearchTerm(data.q);if(term){if(record)recordTracking({name:'search',search_term:term});if(publish)bus?.publish(AnalyticsEvent.SEARCH_VIEWED,{url:trackingLocation(),searchTerm:term,searchResults:{totalCount:data.pagination?.total}});}}
 },[pageKey,data,config.enabled,location.search,consentRevision]);
 const cartState=useRef<any>({data:{},pending:{lines:new Set(),discountCodes:new Set()},revalidating:false}),listeners=useRef(new Set<(state:any)=>void>()),cartTracker=useRef<(()=>void)|null>(null);
 useEffect(()=>{if(!ready||!config.enabled||!window.Shopify?.analytics)return;if(!activeTrackingConsent().analytics){cartTracker.current?.();cartTracker.current=null;return;}cartState.current={...cartState.current,data:cart||{}};if(!cartTracker.current)cartTracker.current=trackCartAnalytics({getState:()=>cartState.current,subscribe:(fn:any)=>{listeners.current.add(fn);return()=>listeners.current.delete(fn);}} as Parameters<typeof trackCartAnalytics>[0]);},[ready,config.enabled,consentRevision]);
 useEffect(()=>{if(!ready)return;cartState.current={...cartState.current,data:cart||{}};if(cart)for(const listener of listeners.current)listener(cartState.current);},[cart,ready]);
 useEffect(()=>()=>{cartTracker.current?.();},[]);
 return null;
}
