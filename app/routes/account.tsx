import {hostedStoreOrigin} from '../lib/hosted-store';
import {environmentContext} from '../storefront.context';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/account';
export function loader({context}:Route.LoaderArgs){return {hostedStoreOrigin:hostedStoreOrigin(context.get(environmentContext))};}
import {ArrowIcon} from '../components/ArrowIcon';
import {Link} from 'react-router';
export default function Account(){const data=useLoaderData<typeof loader>();return <section className="account-page"><p className="eyebrow">Equator</p><h1>Your account</h1><p>Sign in securely to your existing Equator account to view your orders and account details.</p><a className="solid-button" href={`${data.hostedStoreOrigin}/account`} target="_blank" rel="noopener noreferrer">Continue to secure sign-in <ArrowIcon direction="up-right"/></a><p className="account-note">Secure sign-in opens in a new tab. You can continue shopping here.</p><nav><Link to="/wishlist">Your wishlist</Link><Link to="/pages/contact">Contact customer care</Link><Link to="/collections/new-arrivals">Continue shopping</Link></nav></section>;}
