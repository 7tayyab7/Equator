import test from 'node:test';import assert from 'node:assert/strict';

function browser(){
 const storage=new Map(),head=[];const document=new EventTarget();
 document.getElementById=id=>head.find(s=>s.id===id);
 document.createElement=()=>{const tag={remove(){const i=head.indexOf(tag);if(i>=0)head.splice(i,1);}};return tag;};
 document.head={appendChild:tag=>head.push(tag)};
 globalThis.document=document;globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 Object.defineProperty(globalThis,'navigator',{value:{globalPrivacyControl:false},configurable:true});
 globalThis.window={location:{reload(){}},Shopify:{customerPrivacy:{consentStatus:'loaded',analyticsProcessingAllowed:()=>true,marketingAllowed:()=>true,saleOfDataAllowed:()=>true,setTrackingConsent:async()=>undefined}}};
 return {google:()=>head.find(s=>s.id==='equator-google-tag'),head};
}
// Mirrors the live settings: the first GA4 ID is the one Google now rejects (404).
const config={enabled:true,googleAnalyticsIds:['G-4F16VS8G7N','G-9MDQ6213X2'],googleAdsIds:['AW-18209210514','AW-11463346631'],googleTagIds:['GT-55NSXKR2'],googleEventLabels:{},gtmId:'GTM-TEST',gtmEnabled:false,tiktokCatalogIdFormat:null,snapCatalogIdFormat:null,metaPixelId:'111',tiktokPixelId:'TTTEST',snapPixelId:'snap-test'};
const id=src=>new URL(src).searchParams.get('id');

test('candidate order: GA4 first, then Google tags, then Google Ads; duplicates and malformed IDs dropped',async()=>{
 browser();const {googleTagSources}=await import('../app/lib/tracking.client.ts?sources-test');
 assert.deepEqual(googleTagSources(config).map(id),['G-4F16VS8G7N','G-9MDQ6213X2','GT-55NSXKR2','AW-18209210514','AW-11463346631']);
 assert.deepEqual(googleTagSources({googleAnalyticsIds:['G-A',' G-A '],googleTagIds:['','bad id','<script>'],googleAdsIds:['AW-1']}).map(id),['G-A','AW-1']);
 assert.deepEqual(googleTagSources({googleAnalyticsIds:[],googleTagIds:[],googleAdsIds:[]}),[]);
});

test('a rejected Google ID moves straight to the next one (no waiting), and every Google event is kept',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const b=browser(),runtime=await import('../app/lib/tracking.client.ts?google-fallback');
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 assert.equal(id(b.google().src),'G-4F16VS8G7N');
 b.google().onerror();// Google answers 404 for this ID
 assert.equal(id(b.google().src),'G-9MDQ6213X2','next ID requested immediately, no 3 s wait');
 b.google().onload();
 assert.equal(window.__equatorTracking.vendorScripts.sources['equator-google-tag'].endsWith('G-9MDQ6213X2'),true);
 assert.equal(window.__equatorTracking.vendorScripts.fallbacks['equator-google-tag'],1);
 assert.equal(window.__equatorTracking.vendorScripts.retries?.['equator-google-tag'],undefined,'no network retry was needed');
 assert.equal(b.head.filter(s=>s.id==='equator-google-tag').length,1,'exactly one Google tag');
 assert.ok(window.dataLayer.some(args=>args[0]==='config'&&args[1]==='G-9MDQ6213X2'),'working GA4 property configured');
 assert.ok(window.dataLayer.some(args=>args[0]==='event'&&args[1]==='page_view'),'page_view queued for Google');
 t.mock.timers.tick(120000);assert.equal(b.head.filter(s=>s.id==='equator-google-tag').length,1,'nothing re-requested later');
});

test('internet down: all Google IDs fail, then the full list is retried after 3 s, starting from the first ID',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const b=browser(),runtime=await import('../app/lib/tracking.client.ts?google-outage');
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 for(let i=0;i<5;i++)b.google().onerror();
 assert.equal(b.google(),undefined,'list exhausted; waiting before retrying');
 assert.equal(window.__equatorTracking.vendorScripts.retries['equator-google-tag'],1);
 t.mock.timers.tick(3000);assert.equal(id(b.google().src),'G-4F16VS8G7N','retry round starts again from the first ID');
 b.google().onerror();assert.equal(id(b.google().src),'G-9MDQ6213X2');b.google().onload();
 assert.equal(b.head.filter(s=>s.id==='equator-google-tag').length,1);
});

test('a total outage never throws into the page: after the last round it stops quietly',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const b=browser(),runtime=await import('../app/lib/tracking.client.ts?google-dead');
 runtime.initializeTracking(config);
 await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 for(const delay of [3000,10000,30000,undefined]){for(let i=0;i<5;i++)assert.doesNotThrow(()=>b.google().onerror());if(delay)t.mock.timers.tick(delay);}
 t.mock.timers.tick(300000);
 assert.equal(b.google(),undefined,'gave up after 4 rounds');
 assert.equal(window.__equatorTracking.vendorScripts.retries['equator-google-tag'],4);
 assert.doesNotThrow(()=>runtime.recordTracking({name:'search',search_term:'jacket'}));
});
