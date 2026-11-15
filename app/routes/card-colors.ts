import type {Route} from './+types/card-colors';
import {environmentContext} from '../storefront.context';
import {getCardColors} from '../lib/card-colors.server';
export async function loader({request,context}:Route.LoaderArgs){
 const handles=[...new Set((new URL(request.url).searchParams.get('handles')||'').split(',').filter(h=>/^[a-z0-9-]{1,255}$/.test(h)))];
 if(!handles.length||handles.length>4)return Response.json({error:'Provide one to four product handles'},{status:400});
 try{return Response.json(await getCardColors(context.get(environmentContext),handles,request.signal),{headers:{'Cache-Control':'public, max-age=300'}});}
 catch{return Response.json({error:'Color products temporarily unavailable'},{status:503});}
}
