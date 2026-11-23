import test from 'node:test';import assert from 'node:assert/strict';
import {createQuickAddLoader} from '../app/lib/quick-add.client.ts';
test('intent and click share one request, then expire and invalidate availability',async()=>{
 let count=0,time=0,resolve;const loader=createQuickAddLoader(async()=>{count++;return new Promise(done=>resolve=()=>done(Response.json({variants:[{id:'one'}]})));},()=>time);
 const first=loader.load('shirt');assert.equal(loader.load('shirt'),first);assert.equal(count,1);resolve();await first;assert.equal(loader.read('shirt')[0].id,'one');
 time=30001;assert.equal(loader.read('shirt'),undefined);const second=loader.load('shirt');resolve();await second;assert.equal(count,2);loader.invalidate('shirt');assert.equal(loader.read('shirt'),undefined);
});
test('failed prefetch is not retained and opening can retry',async()=>{
 let count=0;const loader=createQuickAddLoader(async()=>++count===1?Response.json({error:'Unavailable'},{status:503}):Response.json({variants:[]}));
 await assert.rejects(loader.load('shirt'),/Unavailable/);assert.deepEqual(await loader.load('shirt'),[]);assert.equal(count,2);
});
test('intent cache does not grow with the full catalogue',async()=>{
 const loader=createQuickAddLoader(async()=>Response.json({variants:[]}));for(let i=0;i<41;i++)await loader.load(`shirt-${i}`);assert.equal(loader.read('shirt-0'),undefined);assert.deepEqual(loader.read('shirt-40'),[]);
});
