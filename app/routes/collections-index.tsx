import {Link,useLoaderData} from 'react-router';
import type {Route} from './+types/collections-index';
import {environmentContext} from '../storefront.context';
import {requestStorefront} from '../lib/storefront.server';
import {ContentLayout} from '../components/ContentLayout';
export async function loader({context,request}:Route.LoaderArgs){const collections:{handle:string;title:string}[]=[];let after:string|null=null;do{const d:{collections:{nodes:typeof collections;pageInfo:{hasNextPage:boolean;endCursor:string|null}}}=await requestStorefront(context.get(environmentContext),`query CollectionDirectory($after:String){collections(first:250,after:$after){nodes{handle title}pageInfo{hasNextPage endCursor}}}`,{after},request.signal);collections.push(...d.collections.nodes);after=d.collections.pageInfo.hasNextPage?d.collections.pageInfo.endCursor:null;}while(after);return {collections};}
export default function Collections(){const {collections}=useLoaderData<typeof loader>();return <ContentLayout title="Collections"><ul className="page-directory"><li><Link to="/collections/all">All products</Link></li>{collections.map(c=><li key={c.handle}><Link to={`/collections/${c.handle}`}>{c.title}</Link></li>)}</ul></ContentLayout>;}
