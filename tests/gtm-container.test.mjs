import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import live from '../app/content/tracking.json' with {type:'json'};
const root=fs.readFileSync(new URL('../app/root.tsx',import.meta.url),'utf8');
test('GTM-56L6HTJ9: dataLayer starts in <head>; gtm.js waits for the third-party gate so it never delays the first taps',()=>{
 const head=root.slice(root.indexOf('<head>'),root.indexOf('</head>'));
 assert.ok(head.includes('id="equator-gtm-init" dangerouslySetInnerHTML={{__html:GTM_INIT}}'));
 assert.ok(head.indexOf('equator-gtm-init')<head.indexOf('equator-startup-recovery'),'GTM dataLayer is the first script in head');
 const init=JSON.parse(root.match(/const GTM_INIT=(".*");/)[1]);
 assert.equal(init,"window.dataLayer = window.dataLayer || [];\n  window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});");
 assert.equal((root.match(/gtm\.js\?id=/g)||[]).length,0,'gtm.js is not a render-time script in the page shell');
 assert.match(root,/useEffect\(\(\)=>\{markHydrated\(\);preloadRouteModules\(\);loadSiteGtm\(\);\},\[\]\);/);
});
test('the site GTM container loads once, through the gate, with the same container ID',async()=>{
 const head=[];const listeners={};
 globalThis.window=globalThis;globalThis.addEventListener=(t,f)=>{(listeners[t]??=[]).push(f);};globalThis.removeEventListener=()=>{};
 globalThis.document={readyState:'complete',getElementById:id=>head.find(s=>s.id===id),createElement:()=>({remove(){}}),head:{appendChild:t=>head.push(t)}};
 const timers=[];globalThis.requestIdleCallback=cb=>timers.push(cb);
 try{
  const runtime=await import('../app/lib/tracking.client.ts?site-gtm');
  assert.equal(runtime.siteGtmURL(),'https://www.googletagmanager.com/gtm.js?id=GTM-56L6HTJ9');
  runtime.loadSiteGtm();runtime.loadSiteGtm();
  assert.equal(head.length,0,'nothing is inserted before the gate opens');
  while(timers.length)timers.shift()();
  const gtm=head.filter(s=>s.id==='equator-gtm');
  assert.equal(gtm.length,1,'exactly one GTM container script');
  assert.equal(gtm[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-56L6HTJ9');assert.equal(gtm[0].async,true);
 }finally{delete globalThis.document;delete globalThis.requestIdleCallback;}
});
test('the background GTM loader is off, so the container never loads twice; Google/Meta/TikTok/Snapchat unchanged',async()=>{
 assert.equal(live.gtmId,'GTM-56L6HTJ9');assert.equal(live.gtmEnabled,false);
 const storage=new Map(),head=[];const document=new EventTarget();document.getElementById=id=>head.find(s=>s.id===id);document.createElement=()=>({remove(){}});document.head={appendChild:t=>head.push(t)};globalThis.document=document;globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};Object.defineProperty(globalThis,'navigator',{value:{globalPrivacyControl:false},configurable:true});globalThis.window={location:{reload(){}},Shopify:{customerPrivacy:{consentStatus:'loaded',analyticsProcessingAllowed:()=>true,marketingAllowed:()=>true,saleOfDataAllowed:()=>true,setTrackingConsent:async()=>undefined}}};
 const runtime=await import('../app/lib/tracking.client.ts?gtm-head');
 runtime.initializeTracking({...live,enabled:true});await runtime.saveTrackingConsent({analytics:true,marketing:true,sharing:true});
 runtime.recordTracking({name:'page_view',page_location:'https://equatorstores.com/'});
 assert.equal(head.some(s=>s.id==='equator-gtm'),false);
 for(const id of ['equator-meta-pixel','equator-tiktok-pixel','equator-snap-pixel'])assert.ok(head.some(s=>s.id===id),id);
 assert.equal(head.some(s=>s.id==='equator-google-tag'),false,'Google runs only through GTM: no site gtag.js');
 assert.ok(globalThis.window?.dataLayer?.some?.(e=>e&&e.event==='equator_page_view')??true,'shopping events reach GTM via dataLayer');
});
