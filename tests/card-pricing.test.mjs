import test from 'node:test';
import assert from 'node:assert/strict';
import {cardCompareAt,discountPercent} from '../app/lib/card-pricing.ts';
test('a genuine uniform sale exposes its original price',()=>assert.equal(cardCompareAt(2175,2175,4350,4350),4350));
test('no markdown is invented for missing, equal or lower compare-at prices',()=>{
 for(const value of [undefined,NaN,0,2000,2175])assert.equal(cardCompareAt(2175,2175,value,value),undefined);
});
test('different variant ranges are not advertised as a misleading single markdown',()=>{
 assert.equal(cardCompareAt(2000,2500,4000,4000),undefined);
 assert.equal(cardCompareAt(2000,2000,3000,4000),undefined);
});

test('percentage follows the actual markdown and never displays invalid or zero discounts',()=>{
 assert.equal(discountPercent(2190,4490),51);assert.equal(discountPercent(2175,4350),50);
 assert.equal(discountPercent(0,100),100);
 for(const pair of [[100,100],[100,0],[-1,100],[NaN,100],[100,Infinity],[99.9,100]])assert.equal(discountPercent(...pair),undefined);
});
