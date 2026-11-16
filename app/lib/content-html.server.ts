import {responsiveImage} from './images.ts';
import sanitizeHtml from 'sanitize-html';

const storeHosts=new Set(['equatorstores.com','www.equatorstores.com','equatorstores.myshopify.com','checkout.equatorstores.com']);
export function contentLink(href:string){
 try{const url=new URL(href,'https://equatorstores.com');
  if(!['https:','http:','mailto:','tel:'].includes(url.protocol))return '';
  if(storeHosts.has(url.hostname)){
   const path=url.pathname.replace(/^\/collections\/[^/]+\/products\//,'/products/');
   if(/^\/(?:products|collections|pages|policies|blogs)(?:\/|$)|^\/(?:cart|search)\/?$|^\/$/.test(path))return `${path}${url.search}${url.hash}`;
   if(url.hostname==='checkout.equatorstores.com')return url.href;
   return `https://equatorstores.com${path}${url.search}${url.hash}`;
  }return url.href;
 }catch{return '';}
}
export function cleanContent(html:string){
 return sanitizeHtml(html,{
  nonTextTags:['script','style','textarea','option','form'],
  allowedTags:[...sanitizeHtml.defaults.allowedTags,'img','picture','source','video','iframe'],
  allowedAttributes:{a:['href','title','target','rel'],img:['src','alt','width','height','loading','decoding','srcset','sizes'],source:['src','type','media'],video:['src','poster','controls','preload','playsinline'],iframe:['src','title','loading','referrerpolicy','allowfullscreen'],th:['colspan','rowspan','scope'],td:['colspan','rowspan']},
  allowedSchemes:['https','http','mailto','tel'],allowProtocolRelative:false,
  allowedIframeHostnames:['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com','www.google.com'],
  transformTags:{
   a:(_tag,attrs)=>{const href=contentLink(attrs.href||'');return{tagName:'a',attribs:{href,...(attrs.title?{title:attrs.title}:{}),...(href.startsWith('https://')?{target:'_blank',rel:'noopener noreferrer'}:{})}};},
   img:(_tag,attrs)=>{const raw=attrs['data-src']||attrs.src||'';let src='';try{const url=new URL(raw,'https://equatorstores.com');if(['https:','http:'].includes(url.protocol)){if(url.searchParams.get('width')==='1')url.searchParams.set('width','1200');src=url.href;}}catch{}const image=responsiveImage(src,1200,[320,640,960,1200],'(max-width:1000px) 100vw, 960px',Number(attrs.width)||undefined);return{tagName:'img',attribs:{src:image.src,...(image.srcSet?{srcset:image.srcSet,sizes:image.sizes!}:{}),alt:attrs.alt||'',loading:'lazy',decoding:'async',...(Number(attrs.width)>0?{width:attrs.width}:{}),...(Number(attrs.height)>0?{height:attrs.height}:{})}};},
   iframe:(_tag,attrs)=>({tagName:'iframe',attribs:{src:attrs.src||'',title:attrs.title||'Embedded content',loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}}),
   h1:'h2',
  },
  exclusiveFilter:frame=>frame.tag==='form',
 });
}
