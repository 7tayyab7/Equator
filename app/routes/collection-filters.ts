import type {Route} from './+types/collection-filters';
import {environmentContext} from '../storefront.context';
import {getCollectionFilters} from '../lib/collection.server';
export async function loader({request,context}:Route.LoaderArgs){
 const handle=new URL(request.url).searchParams.get('handle')||'';
 try{return Response.json({handle,filters:await getCollectionFilters(context.get(environmentContext),handle,request.signal)},{headers:{'Cache-Control':'private, max-age=0'}});}
 catch{return Response.json({handle,error:'Filters could not be loaded. Please try again.'},{status:503});}
}
