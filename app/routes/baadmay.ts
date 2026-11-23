import {getBaadmayConfig} from '../lib/baadmay.server';
import type {Route} from './+types/baadmay';
export async function loader({request}:Route.LoaderArgs){const config=await getBaadmayConfig(request.signal);return Response.json({config},{status:config?200:503,headers:{'Cache-Control':config?'public, max-age=300':'no-store'}});}
