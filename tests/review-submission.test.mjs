import test from 'node:test';
import assert from 'node:assert/strict';
import {submitProductReview} from '../app/lib/review-submission.server.ts';
const origin='https://preview.example';
const fields={id:'gid://shopify/Product/9618568020212',name:'Test Customer',email:'customer@example.com',rating:'4',title:'Review title',body:'Customer feedback.'};
const request=(overrides={},headers={})=>new Request(`${origin}/resources/product-reviews`,{method:'POST',headers:{Origin:origin,...headers},body:new URLSearchParams({...fields,...overrides})});
test('web review targets the exact Shopify product and configured store without credentials or forced verification',async()=>{
 let calls=0;const response=await submitProductReview(request(),'test.myshopify.com',async(url,options)=>{
  calls++;assert.equal(url,'https://judge.me/api/v1/reviews');assert.equal(options.method,'POST');
  assert.deepEqual(JSON.parse(options.body),{shop_domain:'test.myshopify.com',platform:'shopify',id:9618568020212,name:fields.name,email:fields.email,rating:4,title:fields.title,body:fields.body});
  assert.equal(options.headers['X-Api-Token'],undefined);return Response.json({message:'Created review'});
 });
 assert.equal(calls,1);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match((await response.json()).message,/sent to Judge.me/);
});
test('invalid, cross-origin and honeypot submissions never reach Judge.me',async()=>{
 const noSend=async()=>{assert.fail('Invalid review must not be sent');};
 for(const overrides of [{id:''},{id:'bad'},{rating:'0'},{rating:'6'},{rating:'2.5'},{email:'invalid'},{name:' '},{body:''},{body:'a'.repeat(5001)},{website:'spam'}])assert.equal((await submitProductReview(request(overrides),'test.myshopify.com',noSend)).status,400);
 assert.equal((await submitProductReview(request({},{Origin:'https://other.example'}),'test.myshopify.com',noSend)).status,403);
});
test('vendor rejection and network uncertainty are never reported as success or automatically retried',async()=>{
 let calls=0;
 const rejected=await submitProductReview(request(),'test.myshopify.com',async()=>{calls++;return Response.json({error:'Web reviews disabled'},{status:422});});
 assert.equal(rejected.status,502);assert.ok((await rejected.json()).error);assert.equal(calls,1);
 const uncertain=await submitProductReview(request(),'test.myshopify.com',async()=>{calls++;throw new Error('Timeout');});
 assert.equal(uncertain.status,503);assert.match((await uncertain.json()).error,/check your email/);assert.equal(calls,2);
});
