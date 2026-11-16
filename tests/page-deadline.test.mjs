import test from 'node:test';
import assert from 'node:assert/strict';
import {isDeadlinePage,withPageDeadline,PageDeadlineError} from '../app/lib/page-deadline.server.ts';
test('bounds a stuck loader before any Response exists and aborts its upstream work',async()=>{
 let signal;const start=Date.now();
 await assert.rejects(withPageDeadline(new Request('https://equatorstores.com/products/shirt?variant=1'),async request=>{signal=request.signal;return new Promise(()=>{});},20),PageDeadlineError);
 assert.equal(signal.aborted,true);assert.ok(Date.now()-start<500);
});
test('does not interrupt cart, native checkout, privacy API or non-GET requests',async()=>{
 for(const [path,method] of [['/cart','GET'],['/resources/cart','GET'],['/api/unstable/graphql.json','POST'],['/checkout','GET'],['/collections/shirts','POST']]){
  const request=new Request('https://equatorstores.com'+path,{method});assert.equal(isDeadlinePage(request),false);
  const value=await withPageDeadline(request,async scoped=>{assert.equal(scoped,request);return 'unchanged';},1);assert.equal(value,'unchanged');
 }
});

test('search, content, policy and blog documents are bounded while resource routes stay untouched',()=>{
 for(const path of ['/search?q=SKU','/collections','/pages','/pages/contact','/policies/privacy-policy','/blogs','/blogs/news','/blogs/news/story.data'])assert.equal(isDeadlinePage(new Request('https://equatorstores.com'+path)),true,path);
 for(const path of ['/resources/baadmay','/resources/product-reviews','/account/login','/cart/c/example','/sitemap.xml'])assert.equal(isDeadlinePage(new Request('https://equatorstores.com'+path)),false,path);
});
test('preserves response cookies, redirect and original cancellation',async()=>{
 const controller=new AbortController();let scoped;
 const response=new Response(null,{status:302,headers:{Location:'/products/other','Set-Cookie':'test=1; Secure; HttpOnly'}});
 const result=await withPageDeadline(new Request('https://equatorstores.com/collections/shirts.data',{signal:controller.signal}),async request=>{scoped=request;controller.abort();return response;});
 assert.equal(scoped.signal.aborted,true);assert.equal(result,response);assert.equal(result.headers.get('Set-Cookie'),'test=1; Secure; HttpOnly');
});
