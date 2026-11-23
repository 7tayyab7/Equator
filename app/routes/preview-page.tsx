import type {Route} from './+types/preview-page';
import {environmentContext} from '../storefront.context';
import {findSeoRedirect} from '../lib/seo-redirects.server';
import {Link} from 'react-router';
export async function loader({request,context}:Route.LoaderArgs){const target=await findSeoRedirect(context.get(environmentContext),request);if(target)throw new Response(null,{status:301,headers:{Location:target}});throw new Response('Page not found',{status:404});}
export function ErrorBoundary(){return <section className="content-error"><h1>Page not found</h1><p>Explore Equator’s collections, information pages and journal.</p><Link to="/collections/new-arrivals">Shop new arrivals</Link><Link to="/pages">Information & lookbooks</Link><Link to="/blogs/news">Journal</Link></section>;}
export default ErrorBoundary;
