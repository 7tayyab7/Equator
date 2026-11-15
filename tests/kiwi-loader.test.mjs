import test from 'node:test';
import assert from 'node:assert/strict';
import {createKiwiLoader} from '../app/lib/kiwi-loader.ts';

function fixture(timeout=1000){
 const scripts=[],win={};
 const doc={createElement:()=>({remove(){this.removed=true;}}),head:{append:script=>scripts.push(script)}};
 return {scripts,win,load:createKiwiLoader(()=>win,()=>doc,timeout)};
}
test('concurrent product requests share one SDK download',async()=>{
 const f=fixture(),a=f.load(),b=f.load();assert.equal(a,b);assert.equal(f.scripts.length,1);
 f.win.ks={loadSizing(){}};f.scripts[0].onload();assert.equal(await a,f.win.ks);
 assert.equal(await f.load(),f.win.ks);assert.equal(f.scripts.length,1);
});
test('failed SDK downloads can be retried on the next product or click',async()=>{
 const f=fixture(),a=f.load();f.scripts[0].onerror();await assert.rejects(a);
 assert.equal(f.scripts[0].removed,true);
 const b=f.load();assert.equal(f.scripts.length,2);f.win.ks={loadSizing(){}};f.scripts[1].onload();assert.equal(await b,f.win.ks);
});
test('stalled downloads expire rather than poisoning the shared loader',async()=>{
 const f=fixture(5);await assert.rejects(f.load());assert.equal(f.scripts[0].removed,true);
 const b=f.load();f.win.ks={loadSizing(){}};f.scripts[1].onload();assert.equal(await b,f.win.ks);
});
test('a script load without the Kiwi API also permits recovery',async()=>{
 const f=fixture(),a=f.load();f.scripts[0].onload();await assert.rejects(a);
 const b=f.load();f.win.ks={loadSizing(){}};f.scripts[1].onload();await b;
});
