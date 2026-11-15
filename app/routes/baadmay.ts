import {getBaadmayConfig} from '../lib/baadmay.server';
export async function loader(){const config=await getBaadmayConfig();return Response.json({config},{status:config?200:503,headers:{'Cache-Control':config?'public, max-age=300':'no-store'}});}
