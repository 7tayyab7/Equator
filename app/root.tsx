import {hostedStoreOrigin} from './lib/hosted-store';
import trackingSettings from './content/tracking.json';
import {trackingEnabled} from './lib/tracking';
import {TrackingHead,TrackingEvents} from './components/Tracking';
import {SeoHead} from './components/SeoHead';
import seoSite from './content/seo-site.json';
import {indexingEnabled} from './lib/seo';
import {getStoreNavigation} from './lib/navigation.server';
import {StoreNavigationProvider} from './components/StoreNavigationProvider';
import {WishlistProvider} from './components/WishlistProvider';
import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, isRouteErrorResponse, useRouteError,type ShouldRevalidateFunctionArgs} from 'react-router';
import type {ReactNode, CSSProperties} from 'react';
import {settings} from './settings';
import {CartProvider} from './components/CartProvider';
import {StoreLayout} from './components/StoreLayout';
import {BannerSettingsProvider} from './components/BannerSettingsProvider';
import './styles/app.css';
import {storefrontMiddleware} from './storefront.middleware.server';
import type {Route} from './+types/root';
import {getHomepageSettings} from './lib/homepage.server';
import {environmentContext} from './storefront.context';

export const middleware: Route.MiddlewareFunction[] = [storefrontMiddleware];

export async function loader({context,request}:Route.LoaderArgs) {const env=context.get(environmentContext);const [homepage,navigation]=await Promise.all([getHomepageSettings(env),getStoreNavigation(env)]);return {hostedStoreOrigin:hostedStoreOrigin(env),tracking:{...trackingSettings,enabled:trackingEnabled(request,env)},seo:{...seoSite,indexingEnabled:indexingEnabled(request,env,seoSite.origin),requestOrigin:new URL(request.url).origin,logo:settings.logo,socials:settings.socials.map(link=>link.href)},settings:{...settings,...navigation},banners:homepage.banners,announcementVisible:homepage.announcementVisible,influencers:homepage.influencers};}
export function shouldRevalidate({currentUrl,nextUrl,formMethod,defaultShouldRevalidate}:ShouldRevalidateFunctionArgs){if(formMethod&&formMethod.toUpperCase()!=='GET')return defaultShouldRevalidate;if(currentUrl.pathname!==nextUrl.pathname||currentUrl.search!==nextUrl.search)return false;return defaultShouldRevalidate;}

export function Layout({children}: {children: ReactNode}) {
  return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="preconnect" href="https://cdn.shopify.com"/><link rel="icon" type="image/png" href="/images/equator-favicon-emblem-20261110.png?v=20261110"/><link rel="apple-touch-icon" href="/images/equator-favicon-emblem-20261110.png?v=20261110"/><Meta/><SeoHead/><TrackingHead/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>;
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const theme = {
    '--color-paper': data.settings.colors.background,
    '--color-ink': data.settings.colors.text,
    '--color-muted': data.settings.colors.muted,
    '--color-line': data.settings.colors.border,
    '--font-navigation': data.settings.typography.navigation,
    '--font-body': data.settings.typography.body,
    '--font-heading': data.settings.typography.heading,
    '--motion-duration': `${data.settings.motion.duration}ms`,
    '--motion-ease': data.settings.motion.easing,
    '--navigation-height': `${data.settings.header.height}px`,
  } as CSSProperties;
  return <div style={theme}><StoreNavigationProvider menu={data.settings.menu} collectionGroups={data.settings.collectionGroups}><BannerSettingsProvider initialBanners={data.banners}><WishlistProvider><CartProvider><TrackingEvents config={data.tracking}/><StoreLayout hostedStoreOrigin={data.hostedStoreOrigin} settings={data.settings} announcementVisible={data.announcementVisible}><Outlet/></StoreLayout></CartProvider></WishlistProvider></BannerSettingsProvider></StoreNavigationProvider></div>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <main className="error-page"><h1>{isRouteErrorResponse(error) ? error.status : 'Preview unavailable'}</h1><a href="/">Return to Equator</a></main>;
}

