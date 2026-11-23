/**
 * Taps should not wait for page code. The JavaScript and stylesheet of the most visited page types (collection,
 * product, search) are fetched in the background as soon as the first page has started (not after every image has
 * loaded), and immediately when a link to one of them is hovered or touched. Only code and CSS are fetched, never
 * page data, so a tap still makes exactly one data request. File names come from React Router's own manifest, so
 * they always match the current deployment.
 */
import {galleryImage} from './images.ts';
type Route={module?:string;imports?:string[];css?:string[]};
type Manifest={url?:string;routes?:Record<string,Route>};
export const PRELOAD_ROUTES=['routes/collection','routes/product','routes/search'] as const;
type RouteId=typeof PRELOAD_ROUTES[number];

/** Code (modulepreload) and stylesheets (preload as style) for the given routes, without duplicates. */
export function preloadAssets(manifest:Manifest|undefined,ids:readonly string[]=PRELOAD_ROUTES){
 const scripts=new Set<string>(),styles=new Set<string>();
 for(const id of ids){const route=manifest?.routes?.[id];if(!route)continue;
  for(const url of [route.module,...(route.imports||[])])if(url)scripts.add(url);
  for(const url of route.css||[])styles.add(url);}
 return {scripts:[...scripts],styles:[...styles]};
}
/** Which preloadable page a link opens, if any. */
export function routeForHref(href:string|null):RouteId|null{
 if(!href||!href.startsWith('/'))return null;
 if(/^\/collections\/[^/?#]+/.test(href))return 'routes/collection';
 if(/^\/products\/[^/?#]+/.test(href))return 'routes/product';
 if(/^\/search(?:[?#]|$)/.test(href))return 'routes/search';
 return null;
}

const requested=new Set<string>();
function addLink(rel:'modulepreload'|'preload',href:string){
 if(requested.has(href))return;requested.add(href);
 const link=document.createElement('link');link.rel=rel;link.href=href;if(rel==='preload'){link.as='style';}
 link.setAttribute('fetchpriority','low');document.head.appendChild(link);
}
function preload(ids:readonly string[]){
 const manifest=(window as unknown as {__reactRouterManifest?:Manifest}).__reactRouterManifest;
 const {scripts,styles}=preloadAssets(manifest,ids);
 for(const href of scripts)addLink('modulepreload',href);
 for(const href of styles)addLink('preload',href);
}

/** Product link pressed: start the product page's main photo (the same file the gallery will pick) while its data loads. */
function preloadProductPhoto(link:Element){
 const card=link.closest('.product-card')?.querySelector<HTMLImageElement>('img');const url=card?.currentSrc||card?.getAttribute('src');
 if(!url||requested.has('photo:'+url))return;requested.add('photo:'+url);
 const {srcSet,sizes}=galleryImage(url);const preload=document.createElement('link');
 preload.rel='preload';preload.as='image';preload.setAttribute('imagesrcset',srcSet);preload.setAttribute('imagesizes',sizes);preload.setAttribute('fetchpriority','high');document.head.appendChild(preload);
}

export function preloadRouteModules(){
 if(typeof window==='undefined'||typeof document==='undefined')return;
 // Intent: the code of the page behind a hovered or touched link starts downloading before the click completes.
 const onIntent=(event:Event)=>{const link=(event.target as Element|null)?.closest?.('a[href]');const id=routeForHref(link?link.getAttribute('href'):null);if(id)preload([id]);};
 for(const name of ['pointerover','touchstart','focusin'] as const)document.addEventListener(name,onIntent,{passive:true,capture:true});
 // Press (mouse down or tap) only: scrolling past cards never fetches photos.
 const onPress=(event:Event)=>{if(event.type==='pointerdown'&&(event as PointerEvent).pointerType!=='mouse')return;const link=(event.target as Element|null)?.closest?.('a[href]');if(link&&routeForHref(link.getAttribute('href'))==='routes/product')preloadProductPhoto(link);};
 for(const name of ['pointerdown','click'] as const)document.addEventListener(name,onPress,{passive:true,capture:true});
 // Background: everything else once the browser has a quiet moment after start-up (at most 1.5 s later).
 const idle=(callback:()=>void)=>typeof window.requestIdleCallback==='function'?window.requestIdleCallback(callback,{timeout:1500}):window.setTimeout(callback,300);
 idle(()=>preload(PRELOAD_ROUTES));
}
