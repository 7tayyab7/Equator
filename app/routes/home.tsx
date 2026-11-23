import {Suspense} from 'react';
import {Influencers} from '../components/Influencers';
import type {loader as rootLoader} from '../root';
import {ShoppingAssurance} from '../components/ShopCategories';
import {getMerchandising} from '../lib/merchandising.server';
import {CampaignBanners} from '../components/CampaignBanners';
import {ProductRail} from '../components/ProductRail';
import {environmentContext} from '../storefront.context';
import {Await,useLoaderData,useRouteLoaderData} from 'react-router';
import type {Route} from './+types/home';
export async function loader({context,request}:Route.LoaderArgs) {
  const env=context.get(environmentContext);
  const merchandising=await getMerchandising(env,request.signal);
  const arrivals=merchandising.newProducts.slice(0,12);
  return {arrivals};
}
export default function Home() {const data=useLoaderData<typeof loader>(),root=useRouteLoaderData<typeof rootLoader>('root');return <><h1 className="sr-only">Equator Stores</h1><CampaignBanners/><div className="homepage-sections">{root&&<Influencers settings={root.influencers}/>}<Suspense fallback={<section className="pdp-rail" aria-busy="true"><h2>New Arrivals</h2><p role="status">Loading products…</p></section>}><Await resolve={data.arrivals} errorElement={null}>{arrivals=>arrivals.length>0?<ProductRail sectionId="homepage-new-arrivals" title="New Arrivals" products={arrivals}/>:null}</Await></Suspense><ShoppingAssurance/></div></>;}
