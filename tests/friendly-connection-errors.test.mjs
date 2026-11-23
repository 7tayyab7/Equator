import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {requestJSON,JsonRequestNetworkError,JsonRequestTimeoutError} from '../app/lib/json-request.client.ts';
const bag=fs.readFileSync(new URL('../app/components/CartProvider.tsx',import.meta.url),'utf8');

for(const [browser,message] of [['Chrome','Failed to fetch'],['Firefox','NetworkError when attempting to fetch resource.'],['Safari','Load failed']]){
 test(`a dropped connection (${browser}: "${message}") becomes a readable message`,async()=>{
  const send=async()=>{throw new TypeError(message);};
  await assert.rejects(requestJSON('/resources/cart',{method:'POST'},5000,send),error=>error instanceof JsonRequestNetworkError&&error.message==='Connection problem. Please check your internet and try again.');
 });
}

test('an unreadable reply (HTML/plain text instead of JSON) is also a connection problem, not a code error',async()=>{
 const send=async()=>new Response('Timeout',{status:503,headers:{'Content-Type':'text/plain'}});
 await assert.rejects(requestJSON('/resources/cart',{},5000,send),JsonRequestNetworkError);
});

test('cancellation and timeouts keep their own errors; successful replies are unchanged',async()=>{
 const controller=new AbortController();
 const send=(url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))));
 const pending=requestJSON('/x',{signal:controller.signal},5000,send);controller.abort();
 await assert.rejects(pending,error=>!(error instanceof JsonRequestNetworkError));
 await assert.rejects(requestJSON('/x',{},20,()=>new Promise(()=>{})),JsonRequestTimeoutError);
 const ok=await requestJSON('/x',{},5000,async()=>Response.json({cart:null}));assert.deepEqual(ok.data,{cart:null});
});

test('the bag shows the friendly message and re-reads the real bag after a dropped connection (never retries the change)',()=>{
 assert.match(bag,/if\(e instanceof JsonRequestNetworkError\)refreshCart\(\);/);
 assert.match(bag,/'Connection problem\. Your bag has been refreshed\. Please check your internet and try again\.'/);
 assert.match(bag,/function refreshCart\(\)\{void requestJSON<CartResponse>\('\/resources\/cart'\)\.then/);
 assert.doesNotMatch(bag.slice(bag.indexOf('function refreshCart'),bag.indexOf('function refreshCart')+200),/method:'POST'/,'refresh is a read only');
});
