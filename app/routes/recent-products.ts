import type {Route} from './+types/recent-products';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import {cardFields,toCard,type CardNode} from '../lib/product.server';
export async function loader({request,context}:Route.LoaderArgs){const ids=[...new Set((new URL(request.url).searchParams.get('ids')||'').split(',').filter(id=>/^gid:\/\/shopify\/Product\/\d+$/.test(id)))].slice(0,15);if(!ids.length)return {products:[]};try{const data=await requestStorefront<{nodes:(CardNode|null)[]}>(context.get(environmentContext),`query RecentProducts($ids:[ID!]!) @inContext(country:PK,language:EN){nodes(ids:$ids){... on Product{${cardFields}}}}`,{ids},request.signal);return Response.json({products:data.nodes.filter((p):p is CardNode=>!!p&&!!p.availableForSale).map(toCard)},{headers:{'Cache-Control':'private, max-age=60'}});}catch{return {products:[]};}}
