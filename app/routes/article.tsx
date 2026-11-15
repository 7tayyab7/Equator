import {seoLoader} from '../lib/seo-redirects.server';
import {ArrowIcon} from '../components/ArrowIcon';
import {responsiveImage} from '../lib/images';
import {Link,useLoaderData} from 'react-router';
import type {Route} from './+types/article';
import {environmentContext} from '../storefront.context';
import {getArticle} from '../lib/content.server';
import {ContentError} from '../components/ContentLayout';
import {ArticleCard} from '../components/ArticleCard';
export async function loader({params,request,context}:Route.LoaderArgs){return seoLoader(context.get(environmentContext),request,()=>getArticle(context.get(environmentContext),params.blog,params.handle,request.signal));}
export default function Article(){const {article,blog,related}=useLoaderData<typeof loader>();return <article className="journal-article"><header><Link className="eyebrow" to={`/blogs/${blog.handle}`}><ArrowIcon direction="left"/> {blog.title}</Link><h1>{article.title}</h1><p><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</time>{article.authorV2?.name?` / ${article.authorV2.name}`:''}</p></header>{article.image&&<img className="article-cover" {...responsiveImage(article.image.url,1100,[400,640,800,1100,1600],'(max-width:1100px) 100vw, 1100px',article.image.width)} decoding="async" loading="eager" alt={article.image.altText||article.title} width={article.image.width} height={article.image.height} fetchPriority="high"/>}<div className="rich-content article-body" dangerouslySetInnerHTML={{__html:article.contentHtml}}/><footer className="article-footer"><Link to={`/blogs/${blog.handle}`}><ArrowIcon direction="left"/> All stories</Link></footer>{related.length>0&&<section className="related-stories"><h2>More from the journal</h2><div className="journal-grid">{related.map(a=><ArticleCard key={a.id} article={a} blog={blog.handle}/>)}</div></section>}</article>;}
export const ErrorBoundary=ContentError;
