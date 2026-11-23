import test from 'node:test';import assert from 'node:assert/strict';

/** A browser page that is still loading: load and idle only happen when the test says so. */
function loadingBrowser(){
 const storage=new Map(),scripts=[],listeners=new Map(),idle=[],timers=[];const document=new EventTarget();
 document.readyState='loading';document.getElementById=id=>scripts.find(s=>s.id===id);document.createElement=()=>({});document.head={appendChild:s=>scripts.push(s)};
 globalThis.document=document;globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 Object.defineProperty(globalThis,'navigator',{value:{globalPrivacyControl:false},configurable:true});
 globalThis.window={
  location:{reload(){}},
  addEventListener:(name,fn)=>{(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn);},removeEventListener:()=>{},
  requestIdleCallback:fn=>idle.push(fn),setTimeout:(fn,ms)=>timers.push({fn,ms}),
  Shopify:{customerPrivacy:{consentStatus:'loaded',analyticsProcessingAllowed:()=>true,marketingAllowed:()=>true,saleOfDataAllowed:()=>true,setTrackingConsent:async()=>undefined}},
 };
 return {scripts,fire:name=>(listeners.get(name)||[]).forEach(fn=>fn()),idle,timers};
}
const config={enabled:true,googleAnalyticsIds:['G-TEST'],googleAdsIds:['AW-TEST'],googleTagIds:[],googleEventLabels:{},gtmId:'GTM-TEST',gtmEnabled:false,tiktokCatalogIdFormat:null,snapCatalogIdFormat:null,metaPixelId:'111',tiktokPixelId:'TTTEST',snapPixelId:'snap-test'};

test('while the page loads, events queue in every pixel and no vendor script is downloaded; after load + idle each script loads once',async()=>{
 const b=loadingBrowser(),runtime=await import('../app/lib/tracking.client.ts?deferred-test');
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 runtime.recordTracking({name:'search',search_term:'jacket'});
 assert.equal(b.scripts.length,0,'no third-party script during page load');
 assert.ok(window.fbq.queue.some(args=>args[0]==='trackSingle'&&args[2]==='PageView'),'Meta PageView is queued, not lost');
 assert.ok(window.fbq.queue.some(args=>args[0]==='trackSingle'&&args[2]==='Search'));
 assert.ok(window.dataLayer.some(args=>args[0]==='event'&&args[1]==='page_view'),'Google page_view is queued');
 assert.ok(window.snaptr.queue.some(args=>args[0]==='track'&&args[1]==='PAGE_VIEW'));
 b.fire('load');assert.equal(b.scripts.length,0,'still waiting for the browser to be idle');
 for(let i=0;i<b.idle.length;i++)b.idle[i]();
 assert.deepEqual(b.scripts.map(s=>s.id).sort(),['equator-google-tag','equator-meta-pixel','equator-snap-pixel','equator-tiktok-pixel']);
 assert.ok(b.scripts.every(s=>s.async===true));
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/collections/jackets'});
 assert.equal(b.scripts.length,4,'later events never add duplicate scripts');
 assert.equal(window.__equatorTracking.vendorScripts.reason,'page-loaded-and-idle');
 assert.equal(b.timers.find(t=>t.ms===5000)!==undefined,true,'the 5 s safety cap is armed');
});
