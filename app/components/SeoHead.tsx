import {useLocation,useMatches} from 'react-router';
import {buildSeo,safeJsonLd,type SeoContext} from '../lib/seo';
import fallback from '../content/seo-site.json';

const winterCollections={
 '@context':'https://schema.org',
 '@type':'ItemList',
 '@id':'https://equatorstores.com/#winter-collections',
 name:'Winter 2026 Collections',
 description:'Shop the latest winter arrivals and winter clothing collections at Equator Stores.',
 numberOfItems:7,
 itemListElement:[
  {'@type':'ListItem',position:1,name:"New Arrivals - Winter '26",url:'https://equatorstores.com/collections/winter-2026'},
  {'@type':'ListItem',position:2,name:'Winter Clearance - Flat 50% Off',url:'https://equatorstores.com/collections/winter-sale'},
  {'@type':'ListItem',position:3,name:'Jackets',url:'https://equatorstores.com/collections/new-winter-jackets'},
  {'@type':'ListItem',position:4,name:'Sweatshirts',url:'https://equatorstores.com/collections/wwsweatshirts-uppers-hoods'},
  {'@type':'ListItem',position:5,name:'Sweaters',url:'https://equatorstores.com/collections/wwsweaters?menu=casual'},
  {'@type':'ListItem',position:6,name:'Blazers',url:'https://equatorstores.com/collections/new-winter-blazers'},
  {'@type':'ListItem',position:7,name:'Bottoms',url:'https://equatorstores.com/collections/new-winter-trousers'},
 ],
};

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
 {location.pathname==='/'&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(winterCollections)}}/>}
 </>;
}
