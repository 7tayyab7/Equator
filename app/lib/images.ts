/** Shopify owns these transforms; local assets and other vendors stay untouched. */
function imageURL(value:string):URL|null {
 try {
  const url=new URL(value.startsWith('//')?`https:${value}`:value);
  if(['equatorstores.com','www.equatorstores.com','checkout.equatorstores.com'].includes(url.hostname)&&url.pathname.startsWith('/cdn/shop/')){url.hostname='cdn.shopify.com';url.pathname='/s/files/1/0435/3713/7815/'+url.pathname.slice('/cdn/shop/'.length);url.protocol='https:';}
  const shopify=url.hostname==='cdn.shopify.com'||((url.hostname.endsWith('.myshopify.com')||['equatorstores.com','www.equatorstores.com'].includes(url.hostname))&&url.pathname.startsWith('/cdn/shop/'));
  return shopify&&['https:','http:'].includes(url.protocol)&&!/\.(svg|gif)$/i.test(url.pathname)?url:null;
 }catch{return null;}
}
export function shopifyImageURL(value:string,width:number):string {
 const url=imageURL(value);
 if(!url||!Number.isFinite(width)||width<1)return value;
 url.searchParams.set('width',String(Math.min(5760,Math.round(width))));
 // Do not carry a previous fixed height or force a format; preserve aspect ratio
 // and let Shopify negotiate a modern format supported by the requesting browser.
 url.searchParams.delete('height');url.searchParams.delete('format');
 return url.href;
}
export function imageSrcSet(url:string,widths:readonly number[],originalWidth?:number):string|undefined {
 if(!imageURL(url))return undefined;
 const candidates=[...new Set(widths.filter(w=>Number.isFinite(w)&&w>=1).map(w=>Math.min(5760,Math.round(w))))].sort((a,b)=>a-b);
 if(!candidates.length)return undefined;
 const max=Number.isFinite(originalWidth)&&Number(originalWidth)>0?Math.min(Math.round(originalWidth!),candidates.at(-1)!):candidates.at(-1)!;
 const sizes=[...new Set([...candidates.filter(w=>w<=max),max])].sort((a,b)=>a-b);
 return sizes.map(width=>`${shopifyImageURL(url,width)} ${width}w`).join(', ');
}
export function responsiveImage(url:string,width:number,widths:readonly number[],sizes:string,originalWidth?:number) {
 const srcSet=imageSrcSet(url,widths,originalWidth);
 return {src:shopifyImageURL(url,originalWidth?Math.min(width,originalWidth):width),...(srcSet?{srcSet,sizes}:{})};
}

/** Widths offered for product-card photos (shared by the card and its gallery). */
export const CARD_IMAGE_WIDTHS=[240,400,600,800,1000,1200,1600,2000] as const;

/** Product-page gallery photo: one definition shared by the gallery and the tap-time preload, so both pick the same file. */
export const GALLERY_IMAGE_WIDTHS=[400,600,800,1000,1400] as const;
export const GALLERY_IMAGE_SIZES='(max-width:767px) 100vw, 34vw';
export function galleryImage(url:string){
 return {src:shopifyImageURL(url,1000),srcSet:GALLERY_IMAGE_WIDTHS.map(w=>`${shopifyImageURL(url,w)} ${w}w`).join(', '),sizes:GALLERY_IMAGE_SIZES};
}
