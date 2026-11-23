import test from 'node:test';import assert from 'node:assert/strict';

/** A browser whose script tags can be removed and whose downloads the test can fail on purpose. */
function flakyBrowser(){
 const storage=new Map(),head=[];const document=new EventTarget();
 document.getElementById=id=>head.find(s=>s.id===id);
 document.createElement=()=>{const tag={remove(){const i=head.indexOf(tag);if(i>=0)head.splice(i,1);}};return tag;};
 document.head={appendChild:tag=>head.push(tag)};
 globalThis.document=document;globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 Object.defineProperty(globalThis,'navigator',{value:{globalPrivacyControl:false},configurable:true});
 globalThis.window={location:{reload(){}},Shopify:{customerPrivacy:{consentStatus:'loaded',analyticsProcessingAllowed:()=>true,marketingAllowed:()=>true,saleOfDataAllowed:()=>true,setTrackingConsent:async()=>undefined}}};
 return {head,meta:()=>head.find(s=>s.id==='equator-meta-pixel')};
}
const config={enabled:true,googleAnalyticsIds:['G-TEST'],googleAdsIds:[],googleTagIds:[],googleEventLabels:{},gtmId:'GTM-TEST',gtmEnabled:false,tiktokCatalogIdFormat:null,snapCatalogIdFormat:null,metaPixelId:'111',tiktokPixelId:'TTTEST',snapPixelId:'snap-test'};

test('weak internet: a pixel script that fails to download is retried after 3 s, 10 s and 30 s, and events wait in its queue',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const b=flakyBrowser(),runtime=await import('../app/lib/tracking.client.ts?retry-test');
 assert.deepEqual(runtime.VENDOR_RETRY_DELAYS_MS,[3000,10000,30000]);
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 const first=b.meta();assert.ok(first,'Meta script requested');
 // Download fails (connection drop): the tag is removed and nothing is re-requested immediately.
 first.onerror();assert.equal(b.meta(),undefined);
 // A page view during the outage is still queued, and does not trigger a duplicate download.
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/collections/jackets'});
 assert.equal(b.meta(),undefined,'no extra download while a retry is scheduled');
 assert.equal(window.fbq.queue.filter(args=>args[0]==='trackSingle'&&args[2]==='PageView').length,2,'both page views kept');
 t.mock.timers.tick(2999);assert.equal(b.meta(),undefined);
 t.mock.timers.tick(1);const second=b.meta();assert.ok(second,'first retry after 3 s');
 second.onerror();t.mock.timers.tick(10000);const third=b.meta();assert.ok(third,'second retry after 10 s');
 assert.equal(window.__equatorTracking.vendorScripts.retries['equator-meta-pixel'],2);
 // Connection recovers: this download succeeds (no onerror), so no further attempts are scheduled.
 t.mock.timers.tick(60000);assert.equal(b.head.filter(s=>s.id==='equator-meta-pixel').length,1,'exactly one Meta script, no duplicates');
 assert.equal(b.head.filter(s=>s.id==='equator-tiktok-pixel').length,1,'other pixels unaffected');
});

test('a total outage gives up quietly after the last retry; nothing throws into the shop',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const b=flakyBrowser(),runtime=await import('../app/lib/tracking.client.ts?outage-test');
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 for(const delay of [3000,10000,30000]){b.meta().onerror();t.mock.timers.tick(delay);}
 assert.doesNotThrow(()=>b.meta().onerror());
 t.mock.timers.tick(120000);
 assert.equal(b.meta(),undefined,'stops after 3 retries');
 assert.equal(window.__equatorTracking.vendorScripts.retries['equator-meta-pixel'],4);
 assert.doesNotThrow(()=>runtime.recordConfirmedCart({lines:{nodes:[]}},{lines:{nodes:[]}}));
});
