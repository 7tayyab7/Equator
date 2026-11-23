import {isValidHandle} from './handle.ts';
import {articleDates} from './article-dates.server';
import {blogPagination} from './blog-pagination';
import returnsPolicy from '../content/return-exchange-policy.json';
import {requestStorefront} from './storefront.server';
import {cleanContent} from './content-html.server';
import editorialData from '../content/editorial-pages.json';
import {cardFields,toCard,type CardNode} from './product.server';
import {uniqueAvailable} from './product-helpers';
import {nextPageCursor} from './pagination';
export type PageInfo={hasNextPage:boolean;hasPreviousPage:boolean;startCursor:string|null;endCursor:string|null};
type Page={id:string;handle:string;title:string;body:string;seo:{title:string|null;description:string|null}};
type EditorialImage={url:string;width:number;height:number;alt:string};
type Editorial={hero:{mobile?:EditorialImage;desktop?:EditorialImage};images:EditorialImage[];paragraphs:string[];productHandles:string[];videos:string[]};
export const policyFields={'privacy-policy':'privacyPolicy','refund-policy':'refundPolicy','shipping-policy':'shippingPolicy','terms-of-service':'termsOfService'} as const;
const slug=(handle:string)=>{if(!isValidHandle(handle))throw new Response('Page not found',{status:404});};
export async function getContentPage(env:Record<string,string>,handle:string,signal:AbortSignal){
 slug(handle);const data=handle==='return-exchange-policy'?{page:{id:"redesign:return-exchange-policy",handle,title:returnsPolicy.title,body:returnsPolicy.body,seo:returnsPolicy.seo}}:await requestStorefront<{page:Page|null}>(env,`query ContentPage($handle:String!){page(handle:$handle){id handle title body seo{title description}}}`,{handle},signal);
 if(!data.page)throw new Response('Page not found',{status:404});
 const editorial=(editorialData.pages as Record<string,Editorial>)[handle]||null;
 let products:ReturnType<typeof toCard>[]=[];
 if(editorial?.productHandles.length){try{const handles=editorial.productHandles;const aliases=handles.map((_,i)=>`p${i}:product(handle:$p${i}){${cardFields}}`).join(' ');const result=await requestStorefront<Record<string,CardNode|null>>(env,`query EditorialProducts(${handles.map((_,i)=>`$p${i}:String!`).join(',')}) @inContext(country:PK){${aliases}}`,Object.fromEntries(handles.map((h,i)=>[`p${i}`,h])),signal);products=uniqueAvailable(Object.values(result).filter((p):p is CardNode=>!!p),[],8).map(toCard);}catch{/* The editorial remains readable if a product is unavailable. */}}
 const lookbooks=handle==='look-book'?Object.entries(editorialData.pages).map(([key,edit])=>({handle:key,title:key.replaceAll('-',' '),image:edit.images[0]?.url||''})):[];
 return {...data.page,body:cleanContent(data.page.body),editorial,products,lookbooks};
}
export async function getPolicy(env:Record<string,string>,handle:string,signal:AbortSignal){
 if(handle==='refund-policy')return {handle,title:returnsPolicy.title,body:cleanContent(returnsPolicy.body)};
 if(!Object.hasOwn(policyFields,handle))throw new Response('Policy not found',{status:404});const field=policyFields[handle as keyof typeof policyFields];
 const result=await requestStorefront<{shop:Record<string,{title:string;body:string}|null>}>(env,`query Policy{shop{${field}{title body}}}`,{},signal);const policy=result.shop[field];
 if(!policy?.body)throw new Response('Policy not found',{status:404});return {handle,...policy,body:cleanContent(policy.body)};
}
export async function contentDirectory(env:Record<string,string>,signal:AbortSignal){
 const pages:{handle:string;title:string}[]=[],seen=new Set<string>();let after:string|null=null;
 do{const result: {pages:{nodes:{handle:string;title:string}[];pageInfo:{hasNextPage:boolean;endCursor:string}}}=await requestStorefront(env,`query ContentDirectory($after:String){pages(first:100,after:$after){nodes{handle title}pageInfo{hasNextPage endCursor}}}`,{after},signal);pages.push(...result.pages.nodes);after=nextPageCursor(result.pages.pageInfo,seen);}while(after);
 return pages;
}
const articleCardFields=`id handle title publishedAt excerpt content image{url altText width height} authorV2{name} tags`;
export type ArticleCard={id:string;handle:string;title:string;publishedAt:string;updatedAt?:string;excerpt:string;content:string;image:{url:string;altText:string|null;width:number;height:number}|null;authorV2:{name:string}|null;tags:string[]};
const blogCursorCache=new Map<string,{expires:number;cursors:string[]}>();
export async function getBlog(env:Record<string,string>,handle:string,url:URL,signal:AbortSignal){
 slug(handle);const q=(url.searchParams.get('q')||'').trim().slice(0,120),key=env.PUBLIC_STORE_DOMAIN+':'+handle+':'+q;
 let hit=blogCursorCache.get(key);
 if(!hit||hit.expires<Date.now()){
  const cursors:string[]=[],seen=new Set<string>();let after:string|null=null;
  do{const d:{blog:{articles:{edges:{cursor:string}[];pageInfo:{hasNextPage:boolean;endCursor:string|null}}}|null}=await requestStorefront(env,`query BlogPageIndex($handle:String!,$after:String,$query:String){blog(handle:$handle){articles(first:250,after:$after,sortKey:PUBLISHED_AT,reverse:true,query:$query){edges{cursor}pageInfo{hasNextPage endCursor}}}}`,{handle,after,query:q||null},signal);if(!d.blog)throw new Response('Blog not found',{status:404});cursors.push(...d.blog.articles.edges.map(edge=>edge.cursor));after=nextPageCursor(d.blog.articles.pageInfo,seen);}while(after);
  hit={expires:Date.now()+300000,cursors};blogCursorCache.set(key,hit);if(blogCursorCache.size>30)blogCursorCache.delete(blogCursorCache.keys().next().value!);
 }
 const pagination=blogPagination(url.searchParams,hit.cursors);
 const data=await requestStorefront<{blog:{handle:string;title:string;seo:{title:string|null;description:string|null};articles:{nodes:ArticleCard[];pageInfo:PageInfo}}|null}>(env,`query Blog($handle:String!,$after:String,$query:String){blog(handle:$handle){handle title seo{title description}articles(first:9,after:$after,sortKey:PUBLISHED_AT,reverse:true,query:$query){nodes{${articleCardFields}}pageInfo{hasNextPage hasPreviousPage startCursor endCursor}}}}`,{handle,after:pagination.after,query:q||null},signal);
 if(!data.blog)throw new Response('Blog not found',{status:404});return {blog:data.blog,q,pagination};
}
export async function getArticle(env:Record<string,string>,blogHandle:string,handle:string,signal:AbortSignal){
 slug(blogHandle);slug(handle);const datesPromise=articleDates(env,signal).catch(()=>new Map<string,string>());const data=await requestStorefront<{blog:{handle:string;title:string;articleByHandle:(ArticleCard&{contentHtml:string;seo:{title:string|null;description:string|null}})|null;articles:{nodes:ArticleCard[]}}|null}>(env,`query Article($blog:String!,$handle:String!){blog(handle:$blog){handle title articleByHandle(handle:$handle){${articleCardFields} contentHtml seo{title description}}articles(first:4,sortKey:PUBLISHED_AT,reverse:true){nodes{${articleCardFields}}}}}`,{blog:blogHandle,handle},signal);
 if(!data.blog?.articleByHandle)throw new Response('Article not found',{status:404});const {articleByHandle,...blog}=data.blog;
 return {blog,article:{...articleByHandle,updatedAt:(await datesPromise).get(articleByHandle.handle),contentHtml:cleanContent(articleByHandle.contentHtml)},related:blog.articles.nodes.filter(a=>a.id!==articleByHandle.id).slice(0,3)};
}

