import type {Route} from './+types/sitemap-index';
import {environmentContext} from '../storefront.context';
import {sitemapTypes,sitemapRows,sitemapIndexXML} from '../lib/sitemap.server';
import site from '../content/seo-site.json';
export async function loader({context,request}:Route.LoaderArgs){const env=context.get(environmentContext);const groups=await Promise.all(sitemapTypes.map(async kind=>({kind,count:(await sitemapRows(env,kind,request.signal)).length})));return new Response(sitemapIndexXML(site.origin,groups),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}
