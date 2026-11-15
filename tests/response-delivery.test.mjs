import test from 'node:test';
import assert from 'node:assert/strict';
import {completePageResponse,ResponseDeliveryError} from '../app/lib/response-delivery.server.ts';

test('does not hand off a successful page until its delayed final bytes arrive', async()=>{
  let end; const source=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('Equator '));end=()=>{controller.enqueue(new TextEncoder().encode('پاکستان'));controller.close();};}});
  const headers=new Headers({'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store'});
  headers.append('Set-Cookie','shopper=a; Secure; HttpOnly');headers.append('Set-Cookie','consent=denied; Secure');
  let resolved=false;const pending=completePageResponse(new Request('https://equatorstores.com/products/shirt'),new Response(source,{headers}),1000).then(r=>{resolved=true;return r;});
  await new Promise(r=>setTimeout(r,10));assert.equal(resolved,false);end();
  const result=await pending,body=await result.text();assert.equal(body,'Equator پاکستان');
  assert.equal(Number(result.headers.get('Content-Length')),new TextEncoder().encode(body).byteLength);
  assert.equal(result.headers.get('Cache-Control'),'private, no-store');
  assert.deepEqual(result.headers.getSetCookie(),['shopper=a; Secure; HttpOnly','consent=denied; Secure']);
});

test('terminates a stalled data stream even when underlying cancellation never settles',async()=>{
  let cancelled=false;const stream=new ReadableStream({cancel(){cancelled=true;return new Promise(()=>{});}});
  await assert.rejects(completePageResponse(new Request('https://equatorstores.com/collections/shirts.data'),new Response(stream,{headers:{'Content-Type':'text/x-script'}}),20),ResponseDeliveryError);
  assert.equal(cancelled,true);
});

test('leaves redirects, private API/cart responses and non-GET requests untouched',async()=>{
  for(const [path,method,status,type] of [['/products/a','GET',302,'text/html'],['/resources/cart','GET',200,'text/html'],['/cart','GET',200,'text/html'],['/products/a','POST',200,'text/html'],['/api/2026-10/graphql.json','GET',200,'application/json'],['/products/a','HEAD',200,'text/html']]){
    const response=new Response('original',{status,headers:{'Content-Type':type}});
    assert.equal(await completePageResponse(new Request('https://equatorstores.com'+path,{method}),response),response);
    assert.equal(response.bodyUsed,false);
  }
});

test('fails closed if a successful page stream errors after partial output',async()=>{
  const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('<html>'));c.error(Error('upstream interrupted'));}});
  await assert.rejects(completePageResponse(new Request('https://equatorstores.com/'),new Response(stream,{headers:{'Content-Type':'text/html'}})),ResponseDeliveryError);
});
