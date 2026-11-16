export type SeoSite={origin:string;name:string;homeTitle:string;description:string;image?:string|null;homeHeading:string;verification:{name:string;content:string}[]};
export type SeoContext=SeoSite&{indexingEnabled:boolean;requestOrigin:string;logo:string;socials:string[]};
export function indexingEnabled(request:Request,env:Record<string,string>,origin='https://equatorstores.com'){
 return env.SEO_INDEXING_ENABLED==='true'&&new URL(request.url).origin===origin;
}
export function privateSeoPath(path:string){return path.endsWith('.data')||/^\/(?:admin|search|cart|account|wishlist|preview-settings|resources|api|__shopify|checkout|checkouts|buy|apps|tools|wallets|digital_wallets|challenge|contact)(?:\/|$)/.test(path);}
export function filteredSeoURL(url:URL){return [...url.searchParams.keys()].some(key=>/^(?:filter(?:\.|$)|min$|max$|sort$|sort_by$|q$|constraint$|view$)/.test(key));}
export function robotsForURL(url:URL,enabled:boolean,status=200){
 if(!enabled||status>=400||privateSeoPath(url.pathname))return 'noindex, nofollow';
 return filteredSeoURL(url)?'noindex, follow':'index, follow, max-image-preview:large';
}
export function canonicalURL(path:string,search:string,origin:string,page?:number){
 const url=new URL(origin),input=new URLSearchParams(search);url.pathname=path.replace(/\/+$/,'')||'/';
 if(/^\/collections\/[^/]+$/.test(url.pathname)){
  const n=page??Number(input.get('page')||1);if(Number.isSafeInteger(n)&&n>1)url.searchParams.set('page',String(n));
 }else if(/^\/blogs\/[^/]+$/.test(url.pathname)){
  const n=page??Number(input.get('page')||1);if(Number.isSafeInteger(n)&&n>1)url.searchParams.set('page',String(n));else if(page===undefined)for(const key of ['after','before']){const value=input.get(key);if(value&&value.length<=2048){url.searchParams.set(key,value);break;}}
 }
 return url.href;
}
export function seoText(value:string,limit=320){const text=value.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();return text.length>limit?text.slice(0,limit-1).trimEnd()+'…':text;}
export function seoTitle(title:string,custom:string|undefined|null,brand:string){return custom?.trim()||`${title} – ${brand}`;}
export function safeJsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export function seoImage(value:string|undefined|null,origin:string){if(!value)return undefined;try{const url=new URL(value,origin);if(!['http:','https:'].includes(url.protocol))return undefined;url.protocol='https:';if(['equatorstores.com','www.equatorstores.com','checkout.equatorstores.com'].includes(url.hostname)&&url.pathname.startsWith('/cdn/shop/')){url.hostname='cdn.shopify.com';url.pathname='/s/files/1/0435/3713/7815/'+url.pathname.slice('/cdn/shop/'.length);}return url.href;}catch{return undefined;}}
// Loader payloads differ by route; these structural fields are checked before use.
type Data=Record<string,any>;
export function buildSeo(site:SeoContext,routeId:string,path:string,search:string,raw:unknown){
 const data=(raw&&typeof raw==='object'?raw:{}) as Data,kind=routeId.split('/').pop()||'home';
 const canonical=canonicalURL(path,search,site.origin,data.pagination?.page),url=new URL(path+search,site.origin);
 let title=site.homeTitle,description=site.description,image=seoImage(site.image,site.origin),type='website',robots=robotsForURL(url,site.indexingEnabled);
 const graph:Data[]=[],orgID=site.origin+'/#organization',websiteID=site.origin+'/#website';
 const organization={'@type':'Organization','@id':orgID,name:site.name,url:site.origin+'/',logo:{'@type':'ImageObject',url:new URL(site.logo,site.requestOrigin).href},sameAs:site.socials};
 const breadcrumbs=[{name:'Home',url:site.origin+'/'}];
 const addCrumb=(name:string,href=canonical)=>breadcrumbs.push({name,url:href});
 const isMissing=kind==='preview-page'||(['product','collection','content-page','article','blog','policy-page'].includes(kind)&&!Object.keys(data).length);
 if(isMissing){title='Page unavailable – '+site.name;description='Explore Equator collections, products and stories.';robots='noindex, nofollow';}
 else if(data.product){
  const p=data.product;title=seoTitle(p.title,p.seo?.title,site.name);description=p.seo?.description?.trim()||seoText(p.description||data.descriptionHtml||'');type='product';
  const photos=p.gallery?.nodes||p.images?.nodes||[];image=seoImage(photos[0]?.url,site.origin)||image;
  const variants=p.variants?.nodes||[],selected=variants.find((v:Data)=>v.id.split('/').pop()===url.searchParams.get('variant'))||variants[0];
  graph.push({'@type':'Product','@id':canonical+'#product',name:p.title,url:canonical,description,image:photos.map((i:Data)=>seoImage(i.url,site.origin)).filter(Boolean),...(selected?.sku?{sku:selected.sku}:{}),brand:{'@type':'Brand',name:p.vendor||site.name},...(p.productType?{category:p.productType}:{}),offers:variants.filter((v:Data)=>Number.isFinite(Number(v.price?.amount))).map((v:Data)=>({'@type':'Offer',url:canonical+'?variant='+encodeURIComponent(v.id.split('/').pop()),price:v.price.amount,priceCurrency:v.price.currencyCode,availability:`https://schema.org/${p.availableForSale&&v.availableForSale?'InStock':'OutOfStock'}`,...(v.sku?{sku:v.sku}:{}),seller:{'@id':orgID}}))});addCrumb(p.title);
 }else if(data.collection){
  const c=data.collection;title=seoTitle(c.title,c.seo?.title,site.name);description=c.seo?.description?.trim()||seoText(c.description||`Explore ${c.title} at ${site.name}.`);image=seoImage(c.image?.url||data.products?.[0]?.images?.[0]?.url,site.origin)||image;
  if(c.total===0)robots=site.indexingEnabled?'noindex, follow':'noindex, nofollow';addCrumb(c.title);
  graph.push({'@type':'CollectionPage','@id':canonical+'#collection',url:canonical,name:c.title,description,mainEntity:{'@type':'ItemList',itemListElement:(data.products||[]).map((p:Data,i:number)=>({'@type':'ListItem',position:(data.pagination?.offset||0)+i+1,url:site.origin+'/products/'+encodeURIComponent(p.handle),name:p.title}))}});
 }else if(data.article){
  const a=data.article,b=data.blog;title=seoTitle(a.title,a.seo?.title,site.name);description=a.seo?.description?.trim()||seoText(a.excerpt||a.content||'');image=seoImage(a.image?.url,site.origin)||image;type='article';
  addCrumb(b?.title||'Journal',site.origin+'/blogs/'+(b?.handle||'news'));addCrumb(a.title);
  graph.push({'@type':'BlogPosting','@id':canonical+'#article',headline:a.title,description,url:canonical,mainEntityOfPage:canonical,...(image?{image:[image]}:{}),datePublished:a.publishedAt,...(a.updatedAt?{dateModified:a.updatedAt}:{}),author:a.authorV2?.name?{'@type':'Person',name:a.authorV2.name}:{'@id':orgID},publisher:{'@id':orgID}});
 }else if(data.blog){title=seoTitle(data.blog.title,data.blog.seo?.title,site.name);description=data.blog.seo?.description?.trim()||site.description;addCrumb(data.blog.title);graph.push({'@type':'Blog','@id':canonical+'#blog',url:canonical,name:data.blog.title,description});}
 else if(kind==='home'){graph.push({'@type':'WebSite','@id':websiteID,url:site.origin+'/',name:site.name,description});}
 else {const names:Record<string,string>={'content-page':data.title,'policy-page':data.title,'page-directory':'Information & Lookbooks','collections-index':'Collections',archive:'The Archive',search:'Search',account:'Your account','bag-page':'Your Bag',wishlist:'Your wishlist','banner-settings':'Preview settings'};const name=names[kind]||data.title||site.name;title=seoTitle(name,data.seo?.title,site.name);description=data.seo?.description?.trim()||seoText(data.body||site.description);addCrumb(name);if(!privateSeoPath(path))graph.push({'@type':'WebPage','@id':canonical+'#page',url:canonical,name,description});}
 if((data.pagination?.page||1)>1)title+=` – Page ${data.pagination.page}`;
 if(!description)description=site.description;
 if(!isMissing&&!privateSeoPath(path))graph.push(organization,{'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:breadcrumbs.map((crumb,i)=>({'@type':'ListItem',position:i+1,name:crumb.name,item:crumb.url}))});
 return {title,description,canonical,robots,type,image,jsonld:{'@context':'https://schema.org','@graph':graph},article:data.article?{published:data.article.publishedAt,modified:data.article.updatedAt}:undefined};
}
