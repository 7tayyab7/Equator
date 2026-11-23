import {ArrowIcon} from '../components/ArrowIcon';
import {Link,useLoaderData} from 'react-router';
import type {Route} from './+types/page-directory';
import {environmentContext} from '../storefront.context';
import {contentDirectory} from '../lib/content.server';
import {ContentLayout,ContentError} from '../components/ContentLayout';
export async function loader({request,context}:Route.LoaderArgs){return contentDirectory(context.get(environmentContext),request.signal);}
export default function Directory(){const pages=useLoaderData<typeof loader>();return <ContentLayout title="Information & Lookbooks"><ul className="page-directory">{pages.map(p=><li key={p.handle}><Link to={`/pages/${p.handle}`}>{p.title} <span aria-hidden="true"><ArrowIcon direction="up-right"/></span></Link></li>)}</ul></ContentLayout>;}
export const ErrorBoundary=ContentError;
