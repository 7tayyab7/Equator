import test from 'node:test';
import assert from 'node:assert/strict';
import {requestJSON,JsonRequestTimeoutError} from '../app/lib/json-request.client.ts';

test('a stalled cart mutation expires, aborts transport and is never automatically replayed',async()=>{
 let calls=0,signal;
 const send=async(_url,init)=>{calls++;signal=init.signal;assert.equal(init.method,'POST');return new Promise(()=>{});};
 await assert.rejects(requestJSON('/resources/cart',{method:'POST',body:new URLSearchParams({action:'add'})},20,send),JsonRequestTimeoutError);
 assert.equal(calls,1);assert.equal(signal.aborted,true);
});
test('the deadline includes a stalled response body, not just response headers',async()=>{
 const send=async()=>new Response(new ReadableStream({start(){}}),{headers:{'Content-Type':'application/json'}});
 await assert.rejects(requestJSON('/resources/cart',{},20,send),JsonRequestTimeoutError);
});
test('caller cancellation reaches the fetch and cannot deliver stale data after navigation',async()=>{
 const source=new AbortController();let transport;
 await assert.rejects(requestJSON('/resources/cart',{signal:source.signal},100,async(_url,init)=>{transport=init.signal;source.abort();assert.equal(transport.aborted,true);return Response.json({cart:null},{status:503});}),{name:'AbortError'});
});
test('JSON parsing preserves error response status and payload without retrying',async()=>{
 const result=await requestJSON('/resources/cart',{},100,async()=>Response.json({cart:null},{status:503}));assert.equal(result.response.status,503);assert.deepEqual(result.data,{cart:null});
});
