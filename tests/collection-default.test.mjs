import test from 'node:test';import assert from 'node:assert/strict';
import {backendCollectionSort,getCollectionDefaultSort} from '../app/lib/collection-default.server.ts';
import {sortCollection} from '../app/lib/collection-filtering.ts';
test('Liquid default sort names map to shopper labels without treating unknown settings as featured',()=>{
 assert.equal(backendCollectionSort('manual'),'featured');
 for(const value of ['best-selling','created-descending','created-ascending','price-ascending','price-descending','title-ascending','title-descending'])assert.equal(backendCollectionSort(value),value);
 for(const value of [null,'new-unknown-setting',{}])assert.equal(backendCollectionSort(value),'collection-default');
});
test('sort label lookup uses the Shopify-hosted bridge, validates the collection, and fails safely',async()=>{
 const original=globalThis.fetch,env={PUBLIC_CHECKOUT_DOMAIN:'checkout.equatorstores.com'},signal=new AbortController().signal;
 try{
  globalThis.fetch=async url=>{assert.equal(url,'https://equatorstores.myshopify.com/collections/jackets?view=hydrogen-sort');return Response.json({handle:'jackets',defaultSort:'manual'});};
  assert.equal(await getCollectionDefaultSort(env,'jackets',signal),'featured');
  globalThis.fetch=async()=>Response.json({handle:'another',defaultSort:'manual'});assert.equal(await getCollectionDefaultSort(env,'jackets',signal),'collection-default');
  globalThis.fetch=async()=>new Response('unavailable',{status:429});assert.equal(await getCollectionDefaultSort(env,'jackets',signal),'collection-default');
  globalThis.fetch=async()=>{throw Error('network');};assert.equal(await getCollectionDefaultSort(env,'jackets',signal),'collection-default');
 }finally{globalThis.fetch=original;}
});
test('default order is preserved while an explicit featured selection can use Shopify manual ranks',()=>{
 const products=[{id:'b'},{id:'a'}];assert.deepEqual(sortCollection(products,'collection-default'),products);
 assert.deepEqual(sortCollection(products,'featured',new Map([['a',0],['b',1]])).map(p=>p.id),['a','b']);
});
