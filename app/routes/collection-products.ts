import type {Route} from './+types/collection-products';
import {environmentContext} from '../storefront.context';
import {getCollection} from '../lib/collection.server';
import {collectionSearch} from '../lib/collection-state';
export async function loader({request,context}:Route.LoaderArgs){
 const url=new URL(request.url),handle=url.searchParams.get('handle')||'';
 try{const data=await getCollection(context.get(environmentContext),handle,url,request.signal);return Response.json({handle:data.collection.handle,products:data.products,pagination:data.pagination,stateKey:collectionSearch(data.state,'').toString()},{headers:{'Cache-Control':'private, max-age=0'}});}
 catch{return Response.json({error:'More products could not be loaded. Please try again.'},{status:503});}
}
