import test from 'node:test';import assert from 'node:assert/strict';
import {absoluteCss,inlineHead,inlineRootStylesheet} from '../app/lib/inline-css.server.ts';
const CSS_URL='https://cdn.shopify.com/oxygen-v2/1/2/3/4/assets/root-AbC123.css';
const css='@font-face{src:url(./inter-400.woff2) format("woff2")}body{background:url("data:image/png;base64,x")}a{color:red}';
test('font URLs stay next to the stylesheet; data URLs and closing tags are safe',()=>{
 const out=absoluteCss(css+'/*</style>*/',CSS_URL);
 assert.match(out,/url\(https:\/\/cdn\.shopify\.com\/oxygen-v2\/1\/2\/3\/4\/assets\/inter-400\.woff2\)/);
 assert.match(out,/data:image\/png;base64,x/);assert.doesNotMatch(out,/<\/style/);
});
test('the stylesheet link becomes non-blocking and the CSS is inlined before it',()=>{
 const head=`<head><title>x</title><link rel="stylesheet" href="${CSS_URL}"/><link rel="modulepreload" href="/a.js"/>`;
 const out=inlineHead(head,'a{color:red}',CSS_URL);
 assert.match(out,/<style data-inline-css="root">a\{color:red\}<\/style><link rel="stylesheet" href="[^"]+root-AbC123\.css" media="print" onload="this\.media='all'"\/>/);
 assert.ok(out.includes('modulepreload'));
});
function streamed(parts){const enc=new TextEncoder();const bytes=parts.map(p=>typeof p==='string'?enc.encode(p):p);return new Response(new ReadableStream({start(c){for(const b of bytes)c.enqueue(b);c.close();}}),{headers:{'Content-Type':'text/html; charset=utf-8','Content-Length':'999'}});}
test('page is streamed unchanged after the head, including a multi-byte character split across chunks',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response(css,{headers:{'Content-Type':'text/css'}});
 try{
  const dash=new TextEncoder().encode('–');
  const res=await inlineRootStylesheet(new Request('https://aora.pk/'),streamed([`<html><head><title>A `,dash.subarray(0,1),dash.subarray(1),` B</title><link rel="stylesheet" href="${CSS_URL}"/>`,'</head><body>Body – ok</body></html>']));
  const html=await res.text();
  assert.ok(html.includes('<title>A – B</title>'));assert.ok(html.includes('Body – ok'));
  assert.ok(html.includes('<style data-inline-css="root">'));assert.ok(html.includes('media="print"'));
  assert.equal(res.headers.get('Content-Length'),null);
 }finally{globalThis.fetch=original;}
});
test('stylesheet unavailable, data requests and non-HTML: the response is left as it was',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('offline');};
 try{
  const html=await (await inlineRootStylesheet(new Request('https://aora.pk/x'),streamed([`<html><head><link rel="stylesheet" href="https://cdn.shopify.com/assets/root-Zz9.css"/></head><body>ok</body></html>`]))).text();
  assert.ok(html.includes('<link rel="stylesheet" href="https://cdn.shopify.com/assets/root-Zz9.css"/>'));assert.ok(!html.includes('<style'));
  const data=streamed(['x']);assert.equal(await inlineRootStylesheet(new Request('https://aora.pk/products/a.data'),data),data);
 }finally{globalThis.fetch=original;}
});
