import test from 'node:test';import assert from 'node:assert/strict';
import {isFullPriceRecommendation} from '../app/lib/full-price.ts';
const money=amount=>({amount:String(amount),currencyCode:'PKR'});
const product=(min,max,compare)=>({priceRange:{minVariantPrice:money(min),maxVariantPrice:money(max)},compareAtPriceRange:{minVariantPrice:money(compare),maxVariantPrice:money(compare)}});
test('Pair It With accepts only confirmed full-price ranges',()=>{
 assert.equal(isFullPriceRecommendation(product(2000,2000,0)),true);
 assert.equal(isFullPriceRecommendation(product(2000,2500,0)),true);
 assert.equal(isFullPriceRecommendation(product(2000,2000,2000)),true);
 assert.equal(isFullPriceRecommendation(product(2000,2000,4000)),false);
 assert.equal(isFullPriceRecommendation(product(2000,2500,4000)),false);
 assert.equal(isFullPriceRecommendation(product(2000,2500,2300)),false);
});
test('unknown or malformed recommendation pricing fails closed',()=>{
 assert.equal(isFullPriceRecommendation({priceRange:product(2000,2000,0).priceRange}),false);
 for(const value of [NaN,-1,Infinity])assert.equal(isFullPriceRecommendation(product(2000,2000,value)),false);
 const foreign=product(2000,2000,4000);foreign.compareAtPriceRange.maxVariantPrice.currencyCode='USD';assert.equal(isFullPriceRecommendation(foreign),false);
});
