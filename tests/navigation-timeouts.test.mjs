import test from 'node:test';import assert from 'node:assert/strict';
import {withPageDeadline,PageDeadlineError} from '../app/lib/page-deadline.server.ts';
import {pageFailure} from '../app/lib/page-error.server.ts';
test('stalled product, collection and search data requests become plain-text retryable 503 responses',async()=>{
 for(const path of ['/products/example.data','/collections/winter-sale.data','/search.data?q=shirt']){
  const request=new Request('https://equatorstores.com'+path);let response;
  try{await withPageDeadline(request,()=>new Promise(()=>{}),15);}catch(error){assert.ok(error instanceof PageDeadlineError);response=pageFailure(request,error);}
  assert.equal(response.status,503);assert.equal(response.headers.get('Content-Type'),'text/plain');assert.equal(response.headers.get('Retry-After'),'5');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(await response.text(),'Timeout');assert.equal(response.headers.has('X-Remix-Response'),false);
 }
});
test('a document timeout has a customer-facing HTML retry page, while other data errors never contain HTML',async()=>{
 const response=pageFailure(new Request('https://equatorstores.com/products/example'),new PageDeadlineError());assert.equal(response.status,503);assert.match(response.headers.get('Content-Type'),/text\/html/);assert.match(await response.text(),/This page is taking longer than usual/);
 const data=pageFailure(new Request('https://equatorstores.com/products/example.data'),Error('upstream'));assert.equal(data.status,500);assert.equal(data.headers.get('Content-Type'),'text/plain');assert.doesNotMatch(await data.text(),/<html|preview/i);
});
