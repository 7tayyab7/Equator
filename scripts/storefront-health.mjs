// Read-only shopping-page checks. Run production checks from Pakistan under the current geo policy.
import {parseDocument} from 'htmlparser2';
import {getElementsByTagName,textContent} from 'domutils';
const args=process.argv.slice(2),value=name=>args.find(arg=>arg.startsWith(name+'='))?.slice(name.length+1);
const supplied=value('--url');
if(!supplied){console.error('Usage: npm run health:check -- --url=https://equatorstores.com [--product=handle] [--collection=handle]');process.exit(2);}
const base=new URL(supplied),origin=base.origin;
if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS, or a localhost development server.');
const collection=value('--collection')||'new-arrivals',product=value('--product');
for(const handle of [collection,product].filter(Boolean))if(!/^[a-z0-9-]{1,255}$/.test(handle))throw Error('Invalid collection/product handle');
let failures=0;
async function check(path,kind){
 const start=performance.now();
 try{
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000),redirect:'manual'}),html=await response.text();
  if(response.status!==200)throw Error(`HTTP ${response.status}${response.status===403?' (check the real monitor location against the Pakistan-only policy)':''}`);
  if(!response.headers.get('content-type')?.includes('text/html'))throw Error('Expected an HTML document');
  const doc=parseDocument(html),headings=getElementsByTagName('h1',doc,true),title=getElementsByTagName('title',doc,true);
  if(!title.length||!headings.some(node=>textContent(node).trim()))throw Error('Page is missing its actual title/heading');
  if(getElementsByTagName('a',doc,true).length<3||/This page could not finish loading\.|We could not load the current products\./.test(html))throw Error('The storefront returned an error/fallback page');
  if(kind==='product'&&!/ADD TO BAG|Add to bag|Sold out|SOLD OUT/.test(textContent(doc)))throw Error('Product purchase state did not render');
  console.log(JSON.stringify({ok:true,path,status:response.status,ms:Math.round(performance.now()-start),title:textContent(title[0])}));
  return doc;
 }catch(error){failures++;console.error(JSON.stringify({ok:false,path,ms:Math.round(performance.now()-start),error:error.message}));return null;}
}
const home=await check('/','home');
await check(`/collections/${collection}`,'collection');
const firstProduct=product||getElementsByTagName('a',home||parseDocument(''),true).map(node=>node.attribs.href?.match(/^\/products\/([a-z0-9-]+)(?:\?|$)/)?.[1]).find(Boolean);
if(firstProduct)await check(`/products/${firstProduct}?utm_source=facebook&utm_medium=paid`,'product');
else{failures++;console.error(JSON.stringify({ok:false,error:'No product link was found; pass a published product handle using --product.'}));}
process.exitCode=failures?1:0;
