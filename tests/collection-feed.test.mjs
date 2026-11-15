import test from 'node:test';import assert from 'node:assert/strict';
import {appendUniqueProducts} from '../app/lib/collection-feed.ts';
test('infinite collection appends without duplicates and preserves Shopify page order',()=>{
 const first=[{id:'a'},{id:'b'}],next=[{id:'b'},{id:'c'},{id:'c'},{id:'d'}];assert.deepEqual(appendUniqueProducts(first,next).map(p=>p.id),['a','b','c','d']);assert.equal(first.length,2);assert.equal(next.length,4);
});
