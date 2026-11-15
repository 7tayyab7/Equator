import type {Route} from './+types/wishlist-products';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import {cardFields,toCard,type CardNode} from '../lib/product.server';
export async function loader({request,context}:Route.LoaderArgs){const ids=[...new Set((new URL(request.url).searchParams.get('ids')||'').split(',').filter(id=>/^gid:\/\/shopify\/Product\/\d+$/.test(id)))].slice(0,40);if(!ids.length)return {products:[]};const data=await requestStorefront<{nodes:(CardNode|null)[]}>(context.get(environmentContext),`query WishlistProducts($ids:[ID!]!) @inContext(country:PK,language:EN){nodes(ids:$ids){... on Product{${cardFields}}}}`,{ids},request.signal);return Response.json({products:data.nodes.filter((p):p is CardNode=>!!p).map(toCard)},{headers:{'Cache-Control':'private, max-age=60'}});}
