import test from 'node:test';
import assert from 'node:assert/strict';
import {articleDates} from '../app/lib/article-dates.server.ts';
import {sitemapRows} from '../app/lib/sitemap.server.ts';
import {createBaadmayConfigLoader} from '../app/lib/baadmay.server.ts';

async function independentLoad(t,load,payload,check){
 let calls=0,release;
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{calls++;if(calls===1)return new Promise((_,reject)=>{release=()=>reject(Error('First request disconnected'));});return Response.json(payload);};
 let first,timer;
 try{
  first=load();
  await new Promise(resolve=>setImmediate(resolve));
  const second=await Promise.race([load(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('A later request awaited another request’s in-flight I/O')),100);})]);
  clearTimeout(timer);check(second);assert.equal(calls,2);
  release();await first.catch(()=>{});
  check(await load());assert.equal(calls,2,'a failed earlier request must not erase the completed cache');
 }finally{clearTimeout(timer);release?.();await first?.catch(()=>{});globalThis.fetch=original;}
}

test('article dates cache completed data without sharing an unfinished crawler request',async t=>{
 const env={PUBLIC_STORE_DOMAIN:'article-isolation.example',PUBLIC_STOREFRONT_API_TOKEN:'test'};
 await independentLoad(t,()=>articleDates(env),{data:{sitemap:{resources:{hasNextPage:false,items:[{handle:'story',updatedAt:'2026-11-16T00:00:00Z'}]}}}},value=>assert.equal(value.get('story'),'2026-11-16T00:00:00Z'));
});
test('sitemap requests remain independent and cache only a completed catalogue',async t=>{
 const env={PUBLIC_STORE_DOMAIN:'sitemap-isolation.example',PUBLIC_STOREFRONT_API_TOKEN:'test'};
 await independentLoad(t,()=>sitemapRows(env,'products'),{data:{products:{nodes:[{handle:'shirt'}],pageInfo:{hasNextPage:false,endCursor:null}}}},value=>assert.deepEqual(value,[{handle:'shirt'}]));
});
test('a failed installment quote request cannot block shoppers or overwrite a fresh valid quote',async t=>{
 const load=createBaadmayConfigLoader((...args)=>fetch(...args));
 await independentLoad(t,load,[{merchant_name:'equatorstores.myshopify.com',fee:15,min_shop_limit:'1000',max_shop_limit:'30000'}],value=>assert.deepEqual(value,{fee:15,min:1000,max:30000}));
});
