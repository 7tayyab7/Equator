import {seoLoader} from '../lib/seo-redirects.server';
import {useStoreMenu,useSeasonalMenu} from '../components/StoreNavigationProvider';
import {collectionGroup,collectionHref,menuKey} from '../lib/collection-navigation';
import {CollectionFeed} from '../components/CollectionFeed';
import {CollectionViewOptions} from '../components/CollectionViewOptions';
import '../styles/collection-views.css';
import '../styles/collection-header.css';
import {CollectionCategoryNav} from '../components/CollectionCategoryNav';
import {CollectionDescription} from '../components/CollectionDescription';
import {useEffect,useState,type CSSProperties} from 'react';
import {Link,useFetcher,useLoaderData,useNavigation,useSearchParams,isRouteErrorResponse,useRouteError} from 'react-router';
import type {Route} from './+types/collection';
import {environmentContext} from '../storefront.context';
import {getCollection} from '../lib/collection.server';
import {collectionSearch,collectionSortOptions,type CollectionFilter} from '../lib/collection-state';
import {CollectionFilters} from '../components/CollectionFilters';


export async function loader({params,request,context}:Route.LoaderArgs) {return seoLoader(context.get(environmentContext),request,()=>getCollection(context.get(environmentContext),params.handle,new URL(request.url),request.signal));}
export default function CollectionPage() {
 const [desktopColumns,setDesktopColumns]=useState(4),[mobileColumns,setMobileColumns]=useState(2);
 const menu=useStoreMenu(),collectionGroups=useSeasonalMenu();
 const {collection,products,filters:initialFilters,filtersDeferred,state,pagination,defaultSort}=useLoaderData<typeof loader>();
 const facets=useFetcher<{handle:string;filters?:CollectionFilter[];error?:string}>({key:`collection-facets:${collection.handle}`});
 const facetData=facets.data?.handle===collection.handle?facets.data:undefined;
 const filters=filtersDeferred&&facetData?.filters?facetData.filters:initialFilters;
 const [open,setOpen]=useState(false),[filterTab,setFilterTab]=useState<'filter'|'sort'>('filter');const [query,setSearch]=useSearchParams();const navigation=useNavigation();
 const busy=navigation.state!=='idle';
 const filtersError=filtersDeferred&&facetData&&'error' in facetData?facetData.error:'';
 const filtersLoading=filtersDeferred&&!(facetData&&'filters' in facetData)&&!filtersError;
 const loadFilters=()=>void facets.load(`/resources/collection-filters?handle=${encodeURIComponent(collection.handle)}`);
 useEffect(()=>{if(open&&filtersDeferred&&!facetData&&facets.state==='idle')loadFilters();},[open,filtersDeferred,collection.handle,facetData,facets.state]);
 const active=state.selected.map(id=>{const group=filters.find(f=>f.values.some(v=>v.id===id));return {id,label:`${group?.label}: ${group?.values.find(v=>v.id===id)?.label}`};});
 const priceActive=state.min!==''||state.max!=='';

 function openFilters(tab:'filter'|'sort'){setFilterTab(tab);setOpen(true);}
 const path=`/collections/${collection.handle}`,group=collectionGroup([...menu,...collectionGroups],path,query.get('menu'));
 const categories=group?group.children:menu.filter(item=>item.href.startsWith('/collections/'));
 function searchFor(next:typeof state){const params=collectionSearch(next,defaultSort);if(group)params.set('menu',menuKey(group.title));return params;}
 return <section className="collection-page" aria-labelledby="collection-heading" style={{'--collection-desktop-columns':desktopColumns,'--collection-mobile-columns':mobileColumns} as CSSProperties}>
  <div className="collection-header-row">
   <nav className="collection-breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span>{group&&group.href!==path&&<><Link to={collectionHref(group.href,group.title)}>{group.title}</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{collection.title}</span></nav>
   <div className="collection-header-actions"><span className="sr-only" role="status">{busy?'Updating products…':''}</span>
    <label className="collection-header-sort"><span>Sort</span><select aria-label="Sort products" value={state.sort} disabled={busy} onChange={event=>setSearch(searchFor({...state,sort:event.target.value}))}>{collectionSortOptions(defaultSort,state.sort).map(sort=><option key={sort.value} value={sort.value}>{sort.label}</option>)}</select><svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor"/></svg></label>
    <CollectionViewOptions desktop={desktopColumns} mobile={mobileColumns} onDesktop={setDesktopColumns} onMobile={setMobileColumns}/>
    <button className="collection-header-filter" aria-label="Filter and sort products" aria-haspopup="dialog" aria-expanded={open} onClick={()=>openFilters('filter')}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M2 5h20M2 12h20M2 19h20" stroke="currentColor"/><circle cx="8" cy="5" r="2" fill="white" stroke="currentColor"/><circle cx="16" cy="12" r="2" fill="white" stroke="currentColor"/><circle cx="9" cy="19" r="2" fill="white" stroke="currentColor"/></svg>{(active.length>0||priceActive)&&<span className="collection-filter-count">{active.length+Number(priceActive)}</span>}</button>
   </div>
  </div>
  <div className="collection-header-categories"><CollectionCategoryNav>{group&&<Link to={collectionHref(group.href,group.title)} aria-current={group.href===path?'page':undefined}>All</Link>}{categories.map(link=><Link to={collectionHref(link.href,group?.title||link.title)} aria-current={link.href===path?'page':undefined} key={link.href}>{link.title}</Link>)}</CollectionCategoryNav></div>
  {(active.length>0||priceActive)&&<div className="collection-active-filters" aria-label="Active filters">{active.map(item=><button key={item.id} aria-label={`Remove ${item.label}`} onClick={()=>setSearch(searchFor({...state,selected:state.selected.filter(id=>id!==item.id)}))}>{item.label}<span aria-hidden="true">×</span></button>)}{priceActive&&<button aria-label="Remove price filter" onClick={()=>setSearch(searchFor({...state,min:'',max:''}))}>Price: {state.min||'0'} – {state.max||'Any'}<span aria-hidden="true">×</span></button>}<button className="collection-clear-all" onClick={()=>setSearch(searchFor({...state,selected:[],min:'',max:''}))}>Clear filters</button></div>}
  <div className={`collection-results ${busy?'is-loading':''}`} aria-busy={busy}>
   {products.length?<CollectionFeed key={`${collection.handle}:${collectionSearch(state,'')}:${pagination.page}`} handle={collection.handle} menuContext={group?menuKey(group.title):undefined} stateKey={collectionSearch(state,'').toString()} initial={{products,pagination}} paused={busy||open}/>:<div className="collection-empty"><h2>No products found</h2><p>Try a different size or price range.</p><button onClick={()=>setSearch(searchFor({...state,selected:[],min:'',max:''}))}>Clear filters</button></div>}
  </div>

  <header className="collection-intro"><h1 id="collection-heading">{collection.title}</h1>{collection.description&&<CollectionDescription key={collection.handle} description={collection.description}/>}</header>
  <CollectionFilters defaultSort={defaultSort} initialTab={filterTab} open={open} onClose={()=>setOpen(false)} filters={filters} loading={filtersLoading} error={filtersError} onRetry={loadFilters} state={state} currency={products[0]?.currency||'PKR'} onApply={draft=>setSearch(searchFor(draft))}/>
 </section>;
}
export function ErrorBoundary() {
 const error=useRouteError();const missing=isRouteErrorResponse(error)&&error.status===404;
 return <section className="collection-page collection-error"><h1>{missing?'Collection not found':'Collection unavailable'}</h1><p>{missing?'This collection could not be found. Explore another Equator collection below.':'We could not load the current products. Please try again.'}</p><a href="">Try again</a><Link to="/collections/new-arrivals">Shop new arrivals</Link></section>;
}

