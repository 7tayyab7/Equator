import test from 'node:test';import assert from 'node:assert/strict';
import {createPairingLoader} from '../app/lib/pairing.server.ts';
const money=n=>({amount:String(n),currencyCode:'PKR'});
const item=(id,type,compare=0)=>({id,handle:id,title:type,productType:type,description:'Colour: Black Style: Casual',availableForSale:true,images:{nodes:[{url:'https://example.test/'+id,width:100,height:100,altText:null}]},priceRange:{minVariantPrice:money(2000),maxVariantPrice:money(2000)},compareAtPriceRange:{minVariantPrice:money(compare),maxVariantPrice:money(compare)}});
test('targeted paging skips unrelated products; recommendation failure does not hide valid pairings',async()=>{
 const calls=[],sale=item('sale','Shorts',4000),full=item('full','Fashion Pent Smart Fit');
 const loader=createPairingLoader(async(env,query,variables)=>{
  calls.push({query,variables});
  if(query.includes('PairingRecommendations'))throw Error('Recommendations temporarily unavailable');
  if(query.includes('PairingGallery'))return {nodes:[full]};
  return {products:{nodes:variables.after?[full]:[sale],pageInfo:{hasNextPage:!variables.after,endCursor:variables.after?'end':'next'}}};
 });
 const source={id:'top',productType:'T-Shirt'};
 assert.deepEqual((await loader({PUBLIC_STORE_DOMAIN:'test'},source,'images(first:100)',new AbortController().signal,[],1)).map(p=>p.id),['full']);
 assert.equal(calls.filter(c=>c.query.includes('PairingCandidates')).length,2);
 assert.ok(calls.find(c=>c.query.includes('PairingCandidates')).query.includes('images(first:1)'));
 await loader({PUBLIC_STORE_DOMAIN:'test'},source,'images(first:100)',new AbortController().signal,[],1);
 assert.equal(calls.filter(c=>c.query.includes('PairingCandidates')).length,2);
});
test('repeated cursors terminate and do not invent an unsuitable fallback',async()=>{
 let pages=0;
 const loader=createPairingLoader(async(env,query)=>{
  if(query.includes('PairingRecommendations'))return {productRecommendations:[]};
  pages++;return {products:{nodes:[item('sale','Shorts',4000)],pageInfo:{hasNextPage:true,endCursor:'repeated'}}};
 });
 assert.deepEqual(await loader({PUBLIC_STORE_DOMAIN:'test'},{id:'top',productType:'T-Shirt'},'images(first:100)',new AbortController().signal),[]);
 assert.equal(pages,2);
});

test('discounted matches are returned promptly and later page errors preserve partial matches',async()=>{
 const sale=item('sale','Pants',4000);let pageCalls=0;
 const loader=createPairingLoader(async(env,query)=>{
  if(query.includes('PairingRecommendations'))return {productRecommendations:[]};
  if(query.includes('PairingGallery'))throw Error('media metadata temporarily unavailable');
  if(pageCalls++)throw Error('second page temporarily unavailable');
  return {products:{nodes:[sale],pageInfo:{hasNextPage:true,endCursor:'next'}}};
 });
 assert.deepEqual((await loader({PUBLIC_STORE_DOMAIN:'test'},{id:'top',productType:'Sweater'},'images(first:100)',new AbortController().signal)).map(p=>p.id),['sale']);
 assert.equal(pageCalls,2);
});

test('a stalled first shopper cannot hold another shopper’s pairing request',async()=>{
 const candidate=item('pants','Pants');let pageCalls=0,recommendationCalls=0,releasePage,releaseRecommendations;
 const loader=createPairingLoader(async(_env,query)=>{
  if(query.includes('PairingRecommendations')){if(++recommendationCalls===1)return new Promise((_,reject)=>{releaseRecommendations=()=>reject(Error('Disconnected'));});return {productRecommendations:[]};}
  if(query.includes('PairingGallery'))return {nodes:[candidate]};
  if(++pageCalls===1)return new Promise((_,reject)=>{releasePage=()=>reject(Error('Disconnected'));});
  return {products:{nodes:[candidate],pageInfo:{hasNextPage:false,endCursor:null}}};
 });
 const source={id:'top',productType:'Sweater'},env={PUBLIC_STORE_DOMAIN:'independent.example'};
 const first=loader(env,source,'images(first:100)',new AbortController().signal,[],1);let timer;
 try{await new Promise(resolve=>setImmediate(resolve));const second=await Promise.race([loader(env,source,'images(first:100)',new AbortController().signal,[],1),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cross-request stall')),100);})]);assert.deepEqual(second.map(p=>p.id),['pants']);assert.equal(pageCalls,2);assert.equal(recommendationCalls,2);}
 finally{clearTimeout(timer);releasePage?.();releaseRecommendations?.();await first.catch(()=>{});}
});
