import type {Route} from './+types/robots';
import {environmentContext} from '../storefront.context';
import {indexingEnabled} from '../lib/seo';
import site from '../content/seo-site.json';
export function loader({request,context}:Route.LoaderArgs){const enabled=indexingEnabled(request,context.get(environmentContext),site.origin);const body=enabled?`User-agent: *\nDisallow: /cart\nDisallow: /account\nDisallow: /search\nDisallow: /wishlist\nDisallow: /preview-settings\nDisallow: /resources/\n\nSitemap: ${site.origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n';return new Response(body,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});}
