export type ReelSource={url:string;mimeType:string;width:number;height:number};
export type InfluencerReel={id:string;title:string;sources:ReelSource[];poster?:string;product?:{handle:string;title:string}};
export type InfluencersSettings={enabled:boolean;heading:string;reels:InfluencerReel[]};
export type ExperienceField={key:string;value?:string|null;references?:{nodes:{id?:string;fields:ExperienceField[]}[]};reference?:{handle?:string;title?:string;sources?:ReelSource[];previewImage?:{url:string}|null}};
const shopifyURL=(url:string)=>{try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='cdn.shopify.com';}catch{return false;}};
// Shopify can return the store-domain CDN proxy for video references.
// Canonicalise only this store's verified video path to Shopify's media CDN.
function videoURL(url:string){
 try{const u=new URL(url);if(u.protocol!=='https:')return undefined;
  if(u.hostname==='cdn.shopify.com')return u.href;
  if(['equatorstores.com','www.equatorstores.com','checkout.equatorstores.com','equatorstores.myshopify.com'].includes(u.hostname)&&u.pathname.startsWith('/cdn/shop/videos/'))return `https://cdn.shopify.com/videos/${u.pathname.slice('/cdn/shop/videos/'.length)}${u.search}`;
 }catch{}return undefined;
}
export function parseInfluencers(fields:ExperienceField[]):InfluencersSettings{
 const values=Object.fromEntries(fields.map(f=>[f.key,f.value]));
 const entries=fields.find(f=>f.key==='influencers_reels')?.references?.nodes||[];
 return {enabled:values.influencers_enabled!=='false',heading:values.influencers_heading?.trim()&&values.influencers_heading.trim()!=='Influencers'?values.influencers_heading.trim():'Style in Motion',reels:entries.slice(0,20).map((entry,index)=>{
  const video=entry.fields.find(f=>f.key==='video')?.reference,product=entry.fields.find(f=>f.key==='product')?.reference;
  return {id:entry.id||String(index),title:entry.fields.find(f=>f.key==='title')?.value?.trim()||'Influencer video',sources:(video?.sources||[]).flatMap(s=>{const url=videoURL(s.url);return s.mimeType==='video/mp4'&&url&&s.width>0&&s.height>0?[{...s,url}]:[];}),product:product?.handle&&/^[a-z0-9-]+$/.test(product.handle)?{handle:product.handle,title:product.title||'Shop this look'}:undefined,poster:video?.previewImage?.url&&shopifyURL(video.previewImage.url)?video.previewImage.url:undefined};
 })};
}
export function reelSource(sources:ReelSource[],target=720){const sorted=[...sources].sort((a,b)=>a.width-b.width);return sorted.find(s=>s.width>=target)||sorted.at(-1);}
