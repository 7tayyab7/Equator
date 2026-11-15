import {advertisingItemID,cartEvents,catalogID,consentKey,emptyConsent,eventValue,googleConsent,normalizedConsent,safeTrackingURL,type TrackingConfig,type TrackingConsent,type TrackingEvent,type TrackingItem} from './tracking.ts';
type Privacy={consentStatus?:string;analyticsProcessingAllowed:()=>boolean;marketingAllowed:()=>boolean;saleOfDataAllowed?:()=>boolean;currentVisitorConsent?:()=>Record<string,string>;setTrackingConsent:(value:Record<string,boolean>)=>Promise<unknown>};
type Tag=((...args:any[])=>void)&{queue?:unknown[];loaded?:boolean;version?:string;callMethod?:(...args:any[])=>void;handleRequest?:(...args:any[])=>void;push?:Tag};
type TrackingWindow=Window&{Shopify?:{customerPrivacy?:Privacy;analytics?:{publish:(...args:any[])=>void}};dataLayer?:unknown[];gtag?:Tag;fbq?:Tag;_fbq?:Tag;snaptr?:Tag;ttq?:any;TiktokAnalyticsObject?:string;__equatorTracking?:{mode:'live'|'dry-run';events:TrackingEvent[]};};
let config:TrackingConfig|undefined,choice=emptyConsent,choiceKnown=false,googleStarted=false,metaStarted=false,tiktokStarted=false,snapStarted=false,gtmStarted=false;
let currentPage:TrackingEvent|undefined,currentResource:TrackingEvent|undefined;
let consentRevision=0,syncedRevision=-1,syncingConsent:Promise<void>|undefined;
const win=()=>window as TrackingWindow;
const gpc=()=>Boolean((navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl);
export function readTrackingConsent(){if(typeof window==='undefined')return emptyConsent;try{return normalizedConsent(JSON.parse(localStorage.getItem(consentKey)||'null'),gpc());}catch{return emptyConsent;}}
export function hasConsentChoice(){if(choiceKnown)return true;try{return Boolean(localStorage.getItem(consentKey));}catch{return false;}}
function hasNativeChoice(cp:Privacy){try{const value=cp.currentVisitorConsent?.().analytics;return value==='yes'||value==='no';}catch{return false;}}
export function consentBannerNeeded(){if(typeof window==='undefined'||hasConsentChoice())return false;const cp=win().Shopify?.customerPrivacy;if(cp?.consentStatus!=='loaded')return true;try{return !hasNativeChoice(cp)&&!cp.analyticsProcessingAllowed();}catch{return true;}}
export function activeTrackingConsent(){if(!config?.enabled)return choice;const cp=win().Shopify?.customerPrivacy;if(cp?.consentStatus!=='loaded'||syncedRevision!==consentRevision)return emptyConsent;try{return {analytics:(!choiceKnown||choice.analytics)&&cp.analyticsProcessingAllowed(),marketing:(!choiceKnown||choice.marketing)&&!gpc()&&cp.marketingAllowed(),sharing:(!choiceKnown||choice.sharing)&&!gpc()&&(cp.saleOfDataAllowed?.()??false)};}catch{return emptyConsent;}}
function script(id:string,src:string){if(document.getElementById(id))return;const tag=document.createElement('script');tag.id=id;tag.async=true;tag.src=src;document.head.appendChild(tag);}
function google(){const w=win();w.dataLayer??=[];w.gtag??=function(){w.dataLayer!.push(arguments);};return w.gtag;}
function applyGoogleConsent(){google()('consent','update',googleConsent(activeTrackingConsent()));}
function publishConsent(){
 if(config?.enabled){applyGoogleConsent();const active=activeTrackingConsent();win().fbq?.('consent',active.marketing&&active.sharing?'grant':'revoke');if(currentPage)send(currentPage);if(currentResource)send(currentResource);}
 document.dispatchEvent(new Event('equator:consent-changed'));
}
function syncShopifyConsent():Promise<void>{
 if(syncingConsent)return syncingConsent;
 const cp=win().Shopify?.customerPrivacy;
 if(cp?.consentStatus!=='loaded')return Promise.resolve();
 // No local choice is not a refusal. Preserve Shopify's existing consent and regional rules.
 if(!choiceKnown){syncedRevision=consentRevision;publishConsent();return Promise.resolve();}
 syncingConsent=(async()=>{
  // A choice made while Shopify is loading must win over an earlier bootstrap write.
  do{const revision=consentRevision,next=choice;await cp.setTrackingConsent({analytics:next.analytics,marketing:next.marketing,preferences:true,sale_of_data:next.sharing});syncedRevision=revision;}while(syncedRevision!==consentRevision);
  publishConsent();
 })().finally(()=>{syncingConsent=undefined;});
 return syncingConsent;
}
async function settleConsent(sync:Promise<void>){
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{await Promise.race([sync,new Promise<void>(resolve=>{timer=setTimeout(resolve,2500);})]);}catch{/* Keep the saved choice and tracking denied; retry on the next API setup or choice. */}finally{clearTimeout(timer);}
}
export async function saveTrackingConsent(value:TrackingConsent){
 const previous=config?.enabled?activeTrackingConsent():choice,next=normalizedConsent(value,gpc());choice=next;choiceKnown=true;consentRevision++;
 try{localStorage.setItem(consentKey,JSON.stringify(next));}catch{/* Consent still applies for this visit. */}
 // Persist the visitor's choice immediately. Optional tags stay blocked until Shopify confirms it.
 publishConsent();
 if(config?.enabled)await settleConsent(syncShopifyConsent());
 if(config?.enabled&&((previous.analytics&&!next.analytics)||(previous.marketing&&!next.marketing)||(previous.sharing&&!next.sharing))){win().ttq?.revokeConsent?.();win().ttq?.disableCookie?.();window.location.reload();}
}
// Keep unknown consent pending where Shopify requires it; never fabricate a refusal or grant.
export async function setupShopifyConsent(){const cp=win().Shopify?.customerPrivacy;if(cp?.consentStatus!=='loaded')throw Error('Customer Privacy API unavailable');if(!config){choice=readTrackingConsent();choiceKnown=hasConsentChoice();}document.dispatchEvent(new Event('equator:consent-ready'));while(!hasConsentChoice()&&!hasNativeChoice(cp)&&!cp.analyticsProcessingAllowed())await new Promise<void>(resolve=>document.addEventListener('equator:consent-changed',()=>resolve(),{once:true}));await syncShopifyConsent();document.dispatchEvent(new Event('equator:consent-ready'));}
export function initializeTracking(next:TrackingConfig){if(config)return;config=next;choice=readTrackingConsent();choiceKnown=hasConsentChoice();win().__equatorTracking={mode:next.enabled?'live':'dry-run',events:[]};if(next.enabled){google()('consent','default',googleConsent(emptyConsent));google()('set','ads_data_redaction',true);document.addEventListener('visitorConsentCollected',()=>{applyGoogleConsent();if(!activeTrackingConsent().marketing||!activeTrackingConsent().sharing)win().fbq?.('consent','revoke');});}}
const delivered=new Set<string>();

export function recordTracking(event:TrackingEvent){if(!config||typeof window==='undefined')return;const safe={...event,event_id:event.event_id||crypto.randomUUID()};if(event.name==='page_view'){currentPage=safe;currentResource=undefined;}else if(['view_item','view_item_list','search'].includes(event.name))currentResource=safe;const log=win().__equatorTracking?.events;if(log){log.push(safe);if(log.length>60)log.shift();}try{send(safe);}catch{/* Telemetry must never interrupt shopping. */}}
function once(destination:string,event:TrackingEvent,action:()=>void){const key=destination+':'+event.event_id;if(delivered.has(key))return;action();delivered.add(key);if(delivered.size>1200)delivered.delete(delivered.values().next().value!);}
function startGoogle(consent:TrackingConsent){const tag=google();if(!googleStarted){googleStarted=true;tag('js',new Date());script('equator-google-tag','https://www.googletagmanager.com/gtag/js?id='+config!.googleAnalyticsIds[0]);}applyGoogleConsent();if(consent.analytics)for(const id of config!.googleAnalyticsIds)once('config-'+id,{name:'page_view',event_id:'config'},()=>tag('config',id,{send_page_view:false}));if(consent.marketing&&consent.sharing)for(const id of [...config!.googleAdsIds,...config!.googleTagIds])once('config-'+id,{name:'page_view',event_id:'config'},()=>tag('config',id,{send_page_view:false}));}
function startMeta(){if(metaStarted)return;metaStarted=true;const w=win();const fb:Tag=function(...args:any[]){fb.callMethod?fb.callMethod(...args):fb.queue!.push(args);};fb.queue=[];fb.push=fb;fb.loaded=true;fb.version='2.0';w.fbq=fb;w._fbq=fb;fb('consent','grant');fb('set','autoConfig',false,config!.metaPixelId);fb('init',config!.metaPixelId);script('equator-meta-pixel','https://connect.facebook.net/en_US/fbevents.js');}
function startTikTok(){if(tiktokStarted)return;tiktokStarted=true;const w=win(),ttq:any=[];w.TiktokAnalyticsObject='ttq';ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];for(const name of ttq.methods)ttq[name]=(...args:any[])=>ttq.push([name,...args]);ttq._i={[config!.tiktokPixelId]:[]};ttq.instance=(id:string)=>{const instance=ttq._i[id]||[];for(const name of ttq.methods)instance[name]=(...args:any[])=>instance.push([name,...args]);return instance;};ttq._i[config!.tiktokPixelId]._u='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._t={[config!.tiktokPixelId]:Date.now()};ttq._o={[config!.tiktokPixelId]:{}};w.ttq=ttq;script('equator-tiktok-pixel','https://analytics.tiktok.com/i18n/pixel/events.js?sdkid='+config!.tiktokPixelId+'&lib=ttq');}
function startSnap(){if(snapStarted)return;snapStarted=true;const w=win(),snap:Tag=function(...args:any[]){snap.handleRequest?snap.handleRequest(...args):snap.queue!.push(args);};snap.queue=[];w.snaptr=snap;snap('init',config!.snapPixelId,{});script('equator-snap-pixel','https://sc-static.net/scevent.min.js');}
function send(event:TrackingEvent){if(!config?.enabled||(event.name==='view_item_list'&&!event.items?.length))return;const consent=activeTrackingConsent(),{name,event_id,items=[],...params}=event;const ad=consent.marketing&&consent.sharing;if(consent.analytics||ad){startGoogle(consent);const googleItems=items.map(({product_id,variant_id,...item})=>item);if(consent.analytics)once('ga',event,()=>google()('event',name,{...params,items:googleItems,send_to:config!.googleAnalyticsIds,transport_type:'beacon'}));if(ad){const targets=config.googleEventLabels[name]||[];if(targets.length)once('ads',event,()=>google()('event',name,{...params,items:googleItems,send_to:targets,transport_type:'beacon'}));}}
 if(!ad)return;
 if(config.gtmEnabled&&!gtmStarted){gtmStarted=true;win().dataLayer!.push({'gtm.start':Date.now(),event:'gtm.js'});script('equator-gtm','https://www.googletagmanager.com/gtm.js?id='+config.gtmId);}
 // A separate event name avoids firing an existing container's ecommerce tags twice.
 once('data-layer',event,()=>win().dataLayer!.push({event:'equator_'+name,equator:{...params,items,event_id}}));
 const metaNames:Record<string,string>={page_view:'PageView',view_item:'ViewContent',search:'Search',add_to_cart:'AddToCart',add_to_wishlist:'AddToWishlist'};
 if(metaNames[name]){startMeta();once('meta',event,()=>win().fbq!('trackSingle',config!.metaPixelId,metaNames[name],{content_ids:items.map(item=>item.product_id),content_type:'product_group',contents:items.map(item=>({id:item.product_id,quantity:item.quantity,item_price:item.price})),product_variant_ids:items.map(item=>item.variant_id),currency:event.currency,value:event.value,search_string:event.search_term},{eventID:event_id}));}
 const tikNames:Record<string,string>={view_item:'ViewContent',search:'Search',add_to_cart:'AddToCart',add_to_wishlist:'AddToWishlist'};
 if(name==='page_view'||tikNames[name]){startTikTok();once('tiktok',event,()=>name==='page_view'?win().ttq.page():win().ttq.track(tikNames[name],{contents:config!.tiktokCatalogIdFormat?items.map(item=>({content_id:advertisingItemID(item,config!.tiktokCatalogIdFormat),content_type:config!.tiktokCatalogIdFormat==='product'?'product_group':'product',content_name:item.item_name,quantity:item.quantity,price:item.price})):undefined,currency:event.currency,value:event.value,query:event.search_term},{event_id}));}
 const snapNames:Record<string,string>={page_view:'PAGE_VIEW',view_item:'VIEW_CONTENT',search:'SEARCH',add_to_cart:'ADD_CART',add_to_wishlist:'ADD_TO_WISHLIST'};
 if(snapNames[name]){startSnap();once('snap',event,()=>win().snaptr!('track',snapNames[name],{item_ids:config!.snapCatalogIdFormat?items.map(item=>advertisingItemID(item,config!.snapCatalogIdFormat)):undefined,currency:event.currency,price:event.value,number_items:items.reduce((sum,item)=>sum+item.quantity,0),search_string:event.search_term,client_dedup_id:event_id}));}
}
export function recordConfirmedCart(previous:any,current:any){if(!current)return;try{for(const event of cartEvents(previous,current))recordTracking(event);}catch{/* A tracking failure must not turn a successful cart mutation into an error. */}}
export function cartItems(cart:any):TrackingItem[]{return (cart?.lines.nodes||[]).flatMap((line:any)=>{const item=trackingItemSafe(line);return item?[item]:[];});}
function trackingItemSafe(line:any){const product=line.merchandise.product,variant=line.merchandise;const productID=product.id?.split('/').pop(),variantID=variant.id?.split('/').pop();if(!/^\d+$/.test(productID)||!/^\d+$/.test(variantID))return null;const price=Number(variant.price.amount);if(!Number.isFinite(price)||price<0)return null;return {item_id:catalogID({product_id:productID,variant_id:variantID} as TrackingItem),product_id:productID,variant_id:variantID,item_name:product.title,item_variant:variant.title,item_brand:product.vendor,price,quantity:line.quantity};}
export function recordCartViewed(cart:any){const items=cartItems(cart);if(items.length)recordTracking({name:'view_cart',items,value:eventValue(items),currency:cart.cost.totalAmount.currencyCode});}
export function trackingLocation(){return safeTrackingURL(window.location.href);}
