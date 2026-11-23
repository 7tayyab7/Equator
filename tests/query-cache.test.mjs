import test from 'node:test';import assert from 'node:assert/strict';
import {bindQueryRuntime,queryFetch,queryStrategy,queryTimingHeader} from '../app/lib/query-runtime.server.ts';
test('public query cache separates variables and stores successful JSON only',async()=>{
 const original=globalThis.fetch,entries=new Map(),pending=[],env={PUBLIC_STORE_DOMAIN:'test.myshopify.com'},metrics=[];let calls=0,error=false;
 globalThis.fetch=async()=>{calls++;return Response.json(error?{errors:[{message:'unavailable'}]}:{data:{product:{title:'Test'}}});};
 try{
  bindQueryRuntime(env,{cache:{get:k=>entries.get(k),set:(k,v)=>entries.set(k,v)},waitUntil:p=>pending.push(p),metrics,path:'/products/test',cacheEnabled:true});
  const read=async handle=>{const r=await queryFetch(env,'query ProductDetail($handle:String!){product(handle:$handle){title}}',{handle},'https://test.myshopify.com/api/2026-10/graphql.json',{method:'POST'});await r.json();await Promise.all(pending);};
  await read('one');await read('one');assert.equal(calls,1);await read('two');assert.equal(calls,2);error=true;await read('bad');await read('bad');assert.equal(calls,4);
  assert.equal(metrics.length,5);assert.match(queryTimingHeader(metrics),/sf_ProductDetail_0;dur=/);assert.doesNotMatch(queryTimingHeader(metrics),/myshopify|handle|one|two/);
 }finally{globalThis.fetch=original;}
});
test('long cache is limited to public menus/settings; catalogue uses short cache and unlisted operations bypass',()=>{assert.equal(queryStrategy('RedesignNavigation').maxAge,300);assert.equal(queryStrategy('ProductDetail').maxAge,1);for(const name of ['Customer','Cart','Mutation','Anonymous'])assert.equal(queryStrategy(name),null);});
