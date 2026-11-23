import test from 'node:test';import assert from 'node:assert/strict';
import {searchScore} from '../app/lib/search-matching.ts';
import {complementaryTypes,isWaistcoat,complementaryProducts} from '../app/lib/product-helpers.ts';
const item=(title,type='Casual Shirt',description='',id=title)=>({id,title,handle:title.toLowerCase().replaceAll(' ','-'),productType:type,description,availableForSale:true});

test('variant SKU searches find exact and prefix codes without relying on the product name or handle',()=>{
 const jeans={...item('Denim Smart Jean','Jeans'),skus:['W26-DJ-03-DBL-30','W26-DJ-03-DBL-32']};
 assert.equal(searchScore(jeans,'W26-DJ-03-DBL-30'),1000);
 assert.equal(searchScore(jeans,' w26-dj-03-dbl-30 '),1000);
 assert.equal(searchScore(jeans,'W26 DJ 03 DBL 30'),1000);
 assert.equal(searchScore(jeans,'W26-DJ-03'),500);
 assert.equal(searchScore(jeans,'W26-DJ-03-DBL-40'),0);
 assert.equal(searchScore({...jeans,skus:[]},'W26-DJ-03-DBL-30'),0);
 assert.ok(searchScore(jeans,'denim jeans')>0);
 assert.equal(searchScore(jeans,'***'),0);
});
test('search requires every keyword in product identity or labelled specs, never SEO boilerplate',()=>{
 assert.equal(searchScore(item('Cotton Shirt','Casual Shirt','Shop our polo and linen shirt sale now.'),'polo'),0);
 assert.equal(searchScore(item('Cotton Shirt','Casual Shirt','Shop our polo and linen shirt sale now.'),'linen shirt'),0);
 assert.ok(searchScore(item('Navy Shirt','Casual Shirt','Color: Navy Fabric: Linen Fit: Regular'),'linen shirt')>0);
 assert.ok(searchScore(item('Navy Polo','Polo'),'polo')>0);
 assert.ok(searchScore(item('Blue Shirt','Casual Shirt'),'blue shirts')>0);
 assert.equal(searchScore(item('Blue Shirt'),'blue trousers'),0);
 assert.equal(searchScore(item('Blue Shirt'),'***'),0);
});
test('smart shirt pairings exclude sport styles, duplicate/current/cart products and sold out items',()=>{
 const current=item('Black Shirt');
 const products=[item('Navy Pants','Pants'),item('Teal Joggers','Joggers'),item('Mustard Drawstring Pants','Pants'),item('Sold Pants','Pants'),item('Navy Pants','Pants'),item('Beige Pants','Pants'),item('Summer Shorts','Shorts')];products[3].availableForSale=false;
 assert.deepEqual(complementaryProducts(current,products,['Beige Pants']).map(p=>p.title),['Navy Pants']);
 assert.deepEqual(complementaryProducts(item('Hoodie','Hoodie'),products).map(p=>p.title),['Navy Pants','Teal Joggers','Mustard Drawstring Pants','Beige Pants']);
});

test('waistcoats prioritize complete traditional outfits, with no western fallback',()=>{
 const current=item('Navy Waistcoat','Waistcoat');
 const candidates=[item('White Kurta','Kurta'),item('Oxford Shirt','Formal Shirt'),item('Navy Pants','Pants'),item('Grey Kurta Trouser','Kurta Trouser'),item('White Shalwar Kameez','Shalwar Kameez'),item('Sold Shalwar Kameez','Shalwar Kameez'),item('White Shalwar Kameez','Shalwar Kameez')];candidates[5].availableForSale=false;
 assert.equal(isWaistcoat('Waist Coat'),true);
 assert.deepEqual(complementaryTypes('Waistcoat'),['Shalwar Kameez','Kurta Shalwar','Kurta Trouser','Kurta','Qaftan']);
 assert.deepEqual(complementaryProducts(current,candidates).map(p=>p.title),['White Shalwar Kameez','Grey Kurta Trouser','White Kurta']);
 assert.deepEqual(complementaryProducts(current,candidates,['White Shalwar Kameez'],1).map(p=>p.title),['Grey Kurta Trouser']);
 assert.deepEqual(complementaryProducts(current,[item('Oxford Shirt','Formal Shirt'),item('Navy Pants','Pants')]),[]);
});
