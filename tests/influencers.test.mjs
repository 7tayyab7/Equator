import test from 'node:test';import assert from 'node:assert/strict';
import {parseInfluencers,reelSource} from '../app/lib/influencers.ts';
const video=(width,url=`https://cdn.shopify.com/videos/${width}.mp4`)=>({url,mimeType:'video/mp4',width,height:width*2});
test('empty reels remain honest placeholders, with explicit heading and visibility controls',()=>{
 assert.deepEqual(parseInfluencers([]),{enabled:true,heading:'Style in Motion',reels:[]});
 assert.deepEqual(parseInfluencers([{key:'influencers_enabled',value:'false'},{key:'influencers_heading',value:'  Styled by you  '}]),{enabled:false,heading:'Styled by you',reels:[]});
});
test('reel references keep merchant order and titles, accepting only playable Shopify-hosted sources',()=>{
 const result=parseInfluencers([{key:'influencers_reels',references:{nodes:[{id:'one',fields:[{key:'title',value:'First creator'},{key:'video',reference:{sources:[video(480),video(720,'https://other.example/video.mp4'),{...video(1080),mimeType:'application/x-mpegURL'}],previewImage:{url:'https://cdn.shopify.com/poster.jpg'}}}]},{id:'two',fields:[{key:'title',value:'Video coming later'}]}]}}]);
 assert.deepEqual(result.reels.map(r=>r.title),['First creator','Video coming later']);assert.equal(result.reels[0].sources.length,1);assert.equal(result.reels[1].sources.length,0);
});
test('card and popup sources select suitable renditions without mutating original order',()=>{
 const sources=[video(1080),video(480),video(720)];assert.equal(reelSource(sources,480).width,480);assert.equal(reelSource(sources,900).width,1080);assert.equal(reelSource(sources,2000).width,1080);assert.equal(sources[0].width,1080);assert.equal(reelSource([]),undefined);
});

test('reels link only a real Shopify product reference and preserve custom headings',()=>{
 const parse=handle=>parseInfluencers([{key:'influencers_reels',references:{nodes:[{fields:[{key:'title',value:'A styled look'},{key:'product',reference:{handle,title:'Linen Shirt'}}]}]}}]).reels[0];
 assert.deepEqual(parse('linen-shirt').product,{handle:'linen-shirt',title:'Linen Shirt'});assert.equal(parse('https://other.example').product,undefined);
 assert.equal(parseInfluencers([{key:'influencers_heading',value:'Influencers'}]).heading,'Style in Motion');
});


test('real store-domain Shopify video references use the canonical CDN and keep renditions playable',()=>{
 const reel=parseInfluencers([{key:'influencers_reels',references:{nodes:[{fields:[{key:'video',reference:{sources:[video(270,'https://equatorstores.com/cdn/shop/videos/c/vp/reel/reel.SD-480p.mp4?v=1'),video(404,'https://www.equatorstores.com/cdn/shop/videos/c/vp/reel/reel.HD-720p.mp4'),video(720,'https://other.example/cdn/shop/videos/foreign.mp4'),video(720,'http://equatorstores.com/cdn/shop/videos/insecure.mp4'),video(720,'https://equatorstores.com/foreign.mp4')]}}]}]}}]).reels[0];
 assert.equal(reel.sources.length,2);
 assert.equal(reel.sources[0].url,'https://cdn.shopify.com/videos/c/vp/reel/reel.SD-480p.mp4?v=1');
 assert.equal(reelSource(reel.sources,240).width,270);
});

test('reels remain playable after checkout becomes the Online Store primary domain',()=>{
 const sources=['checkout.equatorstores.com','equatorstores.myshopify.com'].map(host=>video(404,`https://${host}/cdn/shop/videos/c/vp/reel/reel.HD-720p.mp4`));
 const reel=parseInfluencers([{key:'influencers_reels',references:{nodes:[{fields:[{key:'video',reference:{sources}}]}]}}]).reels[0];
 assert.equal(reel.sources.length,2);assert.ok(reel.sources.every(source=>source.url==='https://cdn.shopify.com/videos/c/vp/reel/reel.HD-720p.mp4'));
});
