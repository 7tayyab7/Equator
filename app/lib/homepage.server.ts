import {parseInfluencers,type InfluencersSettings,type ReelSource} from './influencers';
import {requestStorefront} from './storefront.server';
import {defaultBanners,type BannerSettings} from '../content/banners';
type Field={key:string;value:string|null;reference?:{handle?:string;title?:string;image?:{url:string;width:number;height:number};sources?:ReelSource[];previewImage?:{url:string}|null};references?:{nodes:{id?:string;fields:Field[]}[]}};
const query=`query HomepageSettings { metaobject(handle:{type:"equator_redesign_homepage",handle:"main"}) { fields { key value references(first:20) { nodes { ... on Metaobject { id fields { key value reference { ... on MediaImage { image { url width height } } ... on Video { sources { url mimeType width height } previewImage { url } } ... on Product { handle title } } } } } } } } }`;
const cache=new Map<string,{expires:number;value:{banners:BannerSettings[];source:string;influencers:InfluencersSettings}}>();
export async function getHomepageSettings(env:Record<string,string>) {
  const fallback={banners:defaultBanners,source:'local',influencers:parseInfluencers([])};
  const domain=env.PUBLIC_STORE_DOMAIN,token=env.PUBLIC_STOREFRONT_API_TOKEN;
  if(!domain||!token)return fallback;
  const key=domain,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
  try {
    const data=await requestStorefront<{metaobject?:{fields:Field[]}}>(env,query,{},AbortSignal.timeout(2500));
    const fields=data.metaobject?.fields;if(!fields)return hit?.value||fallback;
    const entries=fields.find(f=>f.key==='banners')?.references?.nodes||[];
    const banners=entries.map((entry,index)=>{
      const base={...defaultBanners[index%defaultBanners.length],id:entry.id||`shopify-${index}`};
      const patch:Record<string,unknown>={};
      for(const field of entry.fields) {
        const key=field.key.replace(/_([a-z])/g,(_,letter:string)=>letter.toUpperCase());
        if(key==='desktopImage'||key==='mobileImage') {const image=field.reference?.image;if(image?.url){patch[`${key}Url`]=image.url;patch[`${key}Width`]=image.width;patch[`${key}Height`]=image.height;}continue;}
        if(!(key in base))continue;
        const previous=base[key as keyof BannerSettings];
        if(typeof previous==='boolean')patch[key]=field.value==='true';
        else if(typeof previous==='number')patch[key]=key.endsWith('HeadingMaxWidth')?Math.max(160,Math.min(900,Number(field.value)||previous)):Math.max(5,Math.min(85,Number(field.value)||previous));
        else patch[key]=field.value??'';
      }
      return {...base,...patch,alt:typeof patch.alt==='string'&&patch.alt.trim()?patch.alt:base.alt} as BannerSettings;
    });
    const value={banners:banners.length?banners:defaultBanners,source:'shopify',influencers:parseInfluencers(fields)};
    cache.set(key,{expires:Date.now()+60_000,value});return value;
  } catch {return hit?.value||fallback;}
}
