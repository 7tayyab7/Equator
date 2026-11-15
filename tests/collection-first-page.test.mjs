import test from 'node:test';import assert from 'node:assert/strict';
import {fastCollectionFirstPage,collectionPageSort} from '../app/lib/collection-first-page.ts';
test('plain banner destinations can load the first page without indexing the collection',()=>{
 for(const query of ['', 'menu=winter-26', 'page=1', 'sort=collection-default'])assert.equal(fastCollectionFirstPage(new URLSearchParams(query),'jackets'),true);
 for(const query of ['sort=created-descending','sort=featured','sort=price-ascending','page=2','page=bad','filter=size-s','min=100','max=500','after=cursor','before=cursor'])assert.equal(fastCollectionFirstPage(new URLSearchParams(query),'jackets'),false);
 assert.equal(fastCollectionFirstPage(new URLSearchParams(),'all'),false);
});
test('Shopify default order stays separate from explicit manual/newest/price selections',()=>{
 assert.deepEqual(collectionPageSort('collection-default'),{key:'COLLECTION_DEFAULT',reverse:false});
 assert.deepEqual(collectionPageSort('featured'),{key:'MANUAL',reverse:false});
 assert.deepEqual(collectionPageSort('created-descending'),{key:'CREATED',reverse:true});
 assert.deepEqual(collectionPageSort('price-ascending'),{key:'PRICE',reverse:false});
 assert.deepEqual(collectionPageSort('title-descending'),{key:'TITLE',reverse:true});
 assert.deepEqual(collectionPageSort('unknown'),{key:'COLLECTION_DEFAULT',reverse:false});
});
