import test from 'node:test';import assert from 'node:assert/strict';
import {pairedProducts,pairingType} from '../app/lib/product-pairing.ts';
const money=amount=>({amount:String(amount),currencyCode:'PKR'});
const candidate=(id,type='Pants',compare=0,available=true)=>({id,title:type,productType:type,description:'Colour: Black Style: Casual',availableForSale:available,priceRange:{minVariantPrice:money(2000),maxVariantPrice:money(2000)},compareAtPriceRange:{minVariantPrice:money(compare),maxVariantPrice:money(compare)}});
test('shared bag/PDP selection prefers full-price and excludes unavailable and already-bagged products',()=>{
 const pool=[candidate('sale','Pants',4000),candidate('sold','Pants',0,false),candidate('inbag'),candidate('valid'),candidate('valid'),candidate('other','Jeans')];
 assert.deepEqual(pairedProducts({id:'current',productType:'Sweater'},pool,['inbag'],2).map(p=>p.id),['valid','other']);
});
test('waistcoat pairing keeps the traditional-outfit sale exception, never western shirts',()=>{
 const pool=[candidate('shirt','Formal Shirt'),candidate('set','Shalwar Kameez',4000)];
 assert.deepEqual(pairedProducts({id:'waistcoat',productType:'Waistcoat'},pool).map(p=>p.id),['set']);
});

test('real catalog type aliases and missing types resolve without changing source records',()=>{
 for(const [raw,title,expected] of [['Fashion Pent Smart Fit','Black Chino','Pants'],['Jeans Baggy FIt','Denim Jean','Jeans'],['Casual Shirt FS','Cotton Shirt','Casual Shirt'],['T Shirt RN FS','Long Sleeve Tee','T-Shirt'],['','Suede Bomber Jacket','Jacket'],['','Textured Ribbed Sweater','Sweater'],['','Gurkha Waistband Trouser','Pants']])assert.equal(pairingType({productType:raw,title}),expected);
 const original=candidate('pants','Fashion Pent Straight Fit');
 assert.equal(pairedProducts({id:'top',productType:'',title:'Textured Ribbed Sweater'},[original])[0].id,'pants');
 assert.equal(original.productType,'Fashion Pent Straight Fit');
});
test('cold-weather tops do not recommend summer shorts',()=>{
 assert.equal(pairedProducts({id:'top',productType:'Sweatshirt'},[candidate('short','Shorts')]).length,0);
});

test('sale fallback remains complementary and excludes bag items when every match is discounted',()=>{
 const pool=[candidate('short','Shorts',4000),candidate('pants','Pants',4000),candidate('bag','Jeans',4000),candidate('sold','Pants',4000,false)];
 assert.deepEqual(pairedProducts({id:'top',productType:'Sweatshirt'},pool,['bag']).map(p=>p.id),['pants']);
});
