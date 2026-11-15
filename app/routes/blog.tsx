import {seoLoader} from '../lib/seo-redirects.server';
import {ArrowIcon} from '../components/ArrowIcon';
import {Form,Link,useLoaderData,useNavigation} from 'react-router';
import type {Route} from './+types/blog';
import {environmentContext} from '../storefront.context';
import {getBlog} from '../lib/content.server';
import {ContentError} from '../components/ContentLayout';
import {ArticleCard} from '../components/ArticleCard';
export async function loader({params,request,context}:Route.LoaderArgs){return seoLoader(context.get(environmentContext),request,()=>getBlog(context.get(environmentContext),params.blog,new URL(request.url),request.signal));}
export default function Blog(){const {blog,q}=useLoaderData<typeof loader>();const busy=useNavigation().state!=='idle';function cursor(key:string,value:string|null){const p=new URLSearchParams();if(q)p.set('q',q);if(value)p.set(key,value);return `?${p}`;}const info=blog.articles.pageInfo;
 return <section className="journal-page" aria-busy={busy}><header className="journal-header"><div><p className="eyebrow">The Equator journal</p><h1>{blog.title}</h1></div><Form method="get" role="search"><label htmlFor="journal-search">Search stories</label><div><input key={q} id="journal-search" name="q" type="search" defaultValue={q}/><button type="submit">Search</button></div></Form></header>{q&&<p>Results for “{q}” · <Link to={`/blogs/${blog.handle}`}>Clear search</Link></p>}<div className="journal-grid">{blog.articles.nodes.map((a,index)=><ArticleCard key={a.id} article={a} blog={blog.handle} eager={index<3}/>)}</div>{!blog.articles.nodes.length&&<p>No stories found. Try another search.</p>}<nav className="collection-pagination" aria-label="Journal pagination">{info.hasPreviousPage?<Link to={cursor('before',info.startCursor)}><ArrowIcon direction="left"/> Previous stories</Link>:<span/>}{busy&&<span role="status">Loading stories…</span>}{info.hasNextPage?<Link to={cursor('after',info.endCursor)}>More stories <ArrowIcon/></Link>:<span/>}</nav></section>;
}
export const ErrorBoundary=ContentError;
