import {settings} from '../settings';
import {Influencers} from '../components/Influencers';
import type {loader as rootLoader} from '../root';
import {ShopCategories,ShoppingAssurance} from '../components/ShopCategories';
import {getMerchandising} from '../lib/merchandising.server';
import {CampaignBanners} from '../components/CampaignBanners';
import {ProductRail} from '../components/ProductRail';
import {environmentContext} from '../storefront.context';
import {useLoaderData,useRouteLoaderData} from 'react-router';
import type {Route} from './+types/home';
export async function loader({context,request}:Route.LoaderArgs) {
  const env=context.get(environmentContext);
  const merchandising=await getMerchandising(env,request.signal,settings.homepageSections);
  const arrivals=merchandising.newProducts.slice(0,12),excluded=new Set(arrivals.map(p=>p.id));
  const best=merchandising.bestProducts.filter(p=>!excluded.has(p.id)).slice(0,12);
  return {categories:merchandising.categories,arrivals,best};
}
export default function Home() {const data=useLoaderData<typeof loader>(),root=useRouteLoaderData<typeof rootLoader>('root');return <><h1 className="sr-only">Equator Stores</h1><CampaignBanners/><div className="homepage-sections">{root&&<Influencers settings={root.influencers}/>}{settings.homepageSections.categories&&<ShopCategories categories={data.categories}/>}{data.arrivals.length>0&&<ProductRail sectionId="homepage-new-arrivals" title="New Arrivals" products={data.arrivals}/>}{settings.homepageSections.bestSellers&&data.best.length>0&&<ProductRail sectionId="homepage-best-sellers" title="Best Sellers" products={data.best}/>}<ShoppingAssurance/></div></>;}
