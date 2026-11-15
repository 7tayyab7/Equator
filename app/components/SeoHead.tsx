import {useLocation,useMatches} from 'react-router';
import {buildSeo,safeJsonLd,type SeoContext} from '../lib/seo';
import fallback from '../content/seo-site.json';
export function SeoHead(){
 const matches=useMatches(),location=useLocation(),root=matches.find(match=>match.id==='root')?.loaderData as {seo?:SeoContext}|undefined;
 const site=root?.seo||{...fallback,indexingEnabled:false,requestOrigin:fallback.origin,logo:'/images/equator-wordmark-2026.png',socials:[]};
 const match=matches.at(-1),seo=buildSeo(site,match?.id||'home',location.pathname,location.search,match?.loaderData);
 return <><title>{seo.title}</title><meta name="description" content={seo.description}/><meta name="robots" content={seo.robots}/><link rel="canonical" href={seo.canonical}/>
 <meta property="og:site_name" content={site.name}/><meta property="og:type" content={seo.type}/><meta property="og:title" content={seo.title}/><meta property="og:description" content={seo.description}/><meta property="og:url" content={seo.canonical}/><meta property="og:locale" content="en_PK"/>
 {seo.image&&<><meta property="og:image" content={seo.image}/><meta property="og:image:alt" content={seo.title}/></>}
 <meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={seo.title}/><meta name="twitter:description" content={seo.description}/>{seo.image&&<meta name="twitter:image" content={seo.image}/>}
 {seo.article&&<><meta property="article:published_time" content={seo.article.published}/>{seo.article.modified&&<meta property="article:modified_time" content={seo.article.modified}/>}</>}
 {site.verification.map((tag,index)=><meta key={`${tag.name}:${index}`} name={tag.name} content={tag.content}/>)}
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(seo.jsonld)}}/>
 </>;
}
