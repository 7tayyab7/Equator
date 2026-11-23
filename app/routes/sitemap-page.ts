import returnsPolicy from '../content/return-exchange-policy.json';
import type {Route} from './+types/sitemap-page';
import {environmentContext} from '../storefront.context';
import {sitemapTypes,sitemapRows,sitemapXML,type SitemapKind} from '../lib/sitemap.server';
import site from '../content/seo-site.json';
export async function loader({params,context,request}:Route.LoaderArgs){
 if(!sitemapTypes.includes(params.type as SitemapKind)||!/^\d{1,5}\.xml$/.test(params.file))throw new Response('Sitemap not found',{status:404});
 const kind=params.type as SitemapKind,page=Number(params.file.split('.')[0]),rows=await sitemapRows(context.get(environmentContext),kind,request.signal);if(page<1||page>Math.max(1,Math.ceil(rows.length/5000)))throw new Response('Sitemap not found',{status:404});
 return new Response(sitemapXML(site.origin,kind,rows.slice((page-1)*5000,page*5000).map(row=>kind==='pages'&&row.handle==='return-exchange-policy'?{...row,updatedAt:returnsPolicy.updatedOn}:row),kind==='pages'&&page===1),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
