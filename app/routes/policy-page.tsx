import {useLoaderData} from 'react-router';
import type {Route} from './+types/policy-page';
import {environmentContext} from '../storefront.context';
import {getPolicy} from '../lib/content.server';
import {ContentLayout,ContentError} from '../components/ContentLayout';
export async function loader({params,request,context}:Route.LoaderArgs){return getPolicy(context.get(environmentContext),params.handle,request.signal);}
export default function Policy(){const page=useLoaderData<typeof loader>();return <ContentLayout title={page.title}><div className="rich-content" dangerouslySetInnerHTML={{__html:page.body}}/></ContentLayout>;}
export {PageError as ErrorBoundary} from '../components/PageError';
