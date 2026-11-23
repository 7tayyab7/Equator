import {ArrowIcon} from '../components/ArrowIcon';
import {useState} from 'react';
import {Form,Link,useLoaderData,useNavigation,useSearchParams} from 'react-router';
import type {Route} from './+types/search';
import {environmentContext,searchCacheContext} from '../storefront.context';
import {searchProducts} from '../lib/search.server';
import {collectionSearch} from '../lib/collection-state';
import {pageNumbers} from '../lib/collection-filtering';
import {ProductCard} from '../components/ProductCard';
import {CollectionFilters} from '../components/CollectionFilters';
import {ContentError} from '../components/ContentLayout';
export async function loader({context,request}:Route.LoaderArgs){return searchProducts(context.get(environmentContext),new URL(request.url),request.signal,context.get(searchCacheContext));}
export default function Search(){
 const {q,products,filters,state,pagination}=useLoaderData<typeof loader>();const busy=useNavigation().state!=='idle';
 const [open,setOpen]=useState(false),[tab,setTab]=useState<'filter'|'sort'>('filter');const [,setSearch]=useSearchParams();
 function params(page=1){const p=collectionSearch(state,'featured');p.set('q',q);if(page>1)p.set('page',String(page));return p;}
 return <section className="journal-page search-page" aria-busy={busy}><header className="journal-header"><h1>Search</h1><Form method="get" role="search"><label htmlFor="product-search">Search products</label><div><input key={q} id="product-search" name="q" type="search" defaultValue={q} required/><button type="submit">Search</button></div></Form></header>
 {q&&<><div className="collection-toolbar"><p aria-live="polite">{busy?'Searching…':`${pagination.total} products for “${q}”`}</p><div className="collection-toolbar-actions"><button aria-label="Filter search results" onClick={()=>{setTab('filter');setOpen(true);}}>Filter{state.selected.length?` (${state.selected.length})`:''} +</button><button aria-label="Sort search results" onClick={()=>{setTab('sort');setOpen(true);}}>Sort ↓</button></div></div><p className="search-match-note">Matches all keywords in product names, types, codes or labelled specifications.</p></>}
 <div className="product-grid collection-grid">{products.map((p,index)=><ProductCard key={p.id} product={p} collection eager={index<4}/>)}</div>
 {q&&!products.length&&<div className="collection-empty"><h2>No matching products</h2><p>Try another keyword or clear the selected filters.</p><button onClick={()=>setSearch({q})}>Clear filters</button></div>}
 {pagination.pageCount>1&&<nav className="collection-pagination" aria-label="Search pagination"><div className="collection-page-links">{pagination.page>1&&<Link to={`?${params(pagination.page-1)}`}><ArrowIcon direction="left"/> Previous</Link>}{pageNumbers(pagination.page,pagination.pageCount).map((n,i)=>n==='…'?<span key={i}>…</span>:<Link key={n} aria-label={`Page ${n}`} aria-current={n===pagination.page?'page':undefined} to={`?${params(n)}`}>{n}</Link>)}{pagination.page<pagination.pageCount&&<Link to={`?${params(pagination.page+1)}`}>Next <ArrowIcon/></Link>}</div><p>Page {pagination.page} of {pagination.pageCount} · {pagination.total} products</p></nav>}
 <CollectionFilters open={open} initialTab={tab} filters={filters} state={state} onClose={()=>setOpen(false)} currency={products[0]?.currency||'PKR'} onApply={draft=>{const next=collectionSearch(draft,'featured');next.set('q',q);setSearch(next);}} hideBestSelling/>
 </section>;
}
export {PageError as ErrorBoundary} from '../components/PageError';
