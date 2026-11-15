import type {Route} from './+types/product-pairings';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import {cardFields,toCard} from '../lib/product.server';
import {getProductPairings} from '../lib/pairing.server';
import type {PairingSource} from '../lib/product-pairing';
export async function loader({request,context}:Route.LoaderArgs){
 const handle=new URL(request.url).searchParams.get('handle')||'';
 if(!/^[a-z0-9-]{1,255}$/.test(handle))return Response.json({products:[]},{status:400});
 const env=context.get(environmentContext);
 const {product}=await requestStorefront<{product:PairingSource|null}>(env,`query PairingSource($handle:String!){product(handle:$handle){id handle title productType}}`,{handle},request.signal);
 const products=product?await getProductPairings(env,product,cardFields,request.signal):[];
 return Response.json({products:products.map(toCard)},{headers:{'Cache-Control':'public, max-age=60'}});
}
