import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {withoutHttp3} from '../app/lib/alt-svc.server.ts';
const server=fs.readFileSync(new URL('../server.ts',import.meta.url),'utf8');

test('normal responses get Alt-Svc: clear (browsers stay on HTTP/2)',()=>{
 const r=withoutHttp3(new Response('ok',{headers:{'Alt-Svc':'h3=":443"; ma=86400'}}));
 assert.equal(r.headers.get('Alt-Svc'),'clear');
});

test('immutable pass-through responses are copied with status, headers and streamed body intact',async()=>{
 const original=Response.redirect('https://equatorstores.com/cart',302);// Response.redirect has immutable headers
 assert.throws(()=>original.headers.set('X','1'));
 const r=withoutHttp3(original);
 assert.equal(r.status,302);assert.equal(r.headers.get('Location'),'https://equatorstores.com/cart');assert.equal(r.headers.get('Alt-Svc'),'clear');
 const streamed=withoutHttp3(Object.freeze(new Response('body text',{status:201,headers:{'Set-Cookie':'a=1','Content-Type':'text/plain'}})));
 assert.equal(streamed.status,201);assert.equal(await streamed.text(),'body text');assert.equal(streamed.headers.get('Set-Cookie'),'a=1');
});

test('the server wraps every response, including Pakistan-only blocks and error pages',()=>{
 assert.match(server,/return withoutHttp3\(await withPakistanOnly\(request, env, async \(\) => \{/);
 assert.match(server,/return pageFailure\(request,error\);\s*\}\s*\}\)\);/);
});
