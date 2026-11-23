import test from 'node:test';import assert from 'node:assert/strict';
import navigation from '../app/content/navigation.json' with {type:'json'};
import {collectionGroup,collectionHref,menuKey} from '../app/lib/collection-navigation.ts';
import {collectionSearch} from '../app/lib/collection-state.ts';
const groups=navigation.header;
test('Winter 2026 parent collection uses its own dropdown categories',()=>{
 const winter=collectionGroup(groups,'/collections/winter-2026',null);
 assert.equal(winter.title,'Winter ’26');
 assert.ok(winter.children.some(link=>link.href==='/collections/new-winter-jackets'));
 assert.equal(collectionHref(winter.href,winter.title),'/collections/winter-2026?menu=winter-26');
});
test('menu text and image destinations never leave Hydrogen for a legacy store host',()=>{
 for(const host of ['checkout.equatorstores.com','equatorstores.myshopify.com','www.equatorstores.com','equatorstores.com']){
  assert.equal(collectionHref(`https://${host}/collections/new-winter-blazers?sort=created-descending#products`,'Winter ’26'),'/collections/new-winter-blazers?sort=created-descending&menu=winter-26#products');
  assert.equal(collectionHref(`https://${host}/products/test`,'Casual'),'/products/test');
 }
 assert.equal(collectionHref('javascript:alert(1)','Formal'),'#');
});
test('shared collection retains selected seasonal or casual menu after a share/reload',()=>{
 assert.equal(collectionGroup(groups,'/collections/new-winter-jackets','winter-26').title,'Winter ’26');
 assert.equal(collectionGroup(groups,'/collections/jackets-1','casual').title,'Casual');
 assert.equal(collectionGroup(groups,'/collections/new-winter-jackets',null).title,'Winter ’26');
});
test('formal and clearance pages use their actual parents and never invent a group',()=>{
 assert.equal(collectionGroup(groups,'/collections/formal-shirts',null).title,'Formal');
 assert.equal(collectionGroup(groups,'/collections/summer-sale',null).title,'Clearance');
 assert.equal(collectionGroup(groups,'/collections/new-arrivals',null),undefined);
 assert.equal(collectionGroup(groups,'/collections/jackets-1','formal').title,'Casual');
});
test('context links preserve filter/sort query values and do not alter external or editorial links',()=>{
 const url=new URL(collectionHref('/collections/jackets-1?sort=price-ascending&filter=size-s','Winter ’26'),'https://preview.local');
 assert.equal(url.searchParams.get('menu'),'winter-26');assert.equal(url.searchParams.get('filter'),'size-s');assert.equal(url.searchParams.get('sort'),'price-ascending');
 assert.equal(collectionHref('/pages/summer-26','Casual'),'/pages/summer-26');
 assert.equal(collectionHref('https://other.example/collections/a','Formal'),'https://other.example/collections/a');
});
test('sort/filter URL updates can keep menu context without leaking it into Storefront filter state',()=>{
 const state={selected:['size-s'],min:'10',max:'100',sort:'price-descending'};const params=collectionSearch(state);params.set('menu',menuKey('Winter ’26'));
 assert.equal(params.get('menu'),'winter-26');assert.equal(params.get('sort'),'price-descending');assert.deepEqual(params.getAll('filter'),['size-s']);assert.equal(collectionSearch(state).has('menu'),false);
});

test('sale parent pages choose their own categories even from Clearance context',()=>{
 const all=[...navigation.header,...navigation.collectionGroups];
 const summer=collectionGroup(all,'/collections/summer-sale','clearance');
 const winter=collectionGroup(all,'/collections/winter-sale','clearance');
 assert.equal(summer.title,'Summer Sale');assert.equal(summer.children.length,8);
 assert.ok(summer.children.some(c=>c.href==='/collections/sscasual-shirts'));
 assert.equal(winter.title,'Winter Sale');assert.equal(winter.children.length,9);
 assert.ok(winter.children.some(c=>c.href==='/collections/co-ord-set'));
 assert.equal(collectionGroup(all,'/collections/jeans-for-men','summer-sale').title,'Summer Sale');
 assert.equal(collectionGroup(all,'/collections/casual','winter-26').title,'Casual');
});
