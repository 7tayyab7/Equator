import {EARLY_ADD_SCRIPT,markHydrated} from './lib/early-add';
import {EARLY_MENU_SCRIPT} from './lib/early-menu';
import {preloadRouteModules} from './lib/route-preload.client';
import {installStartupRecovery} from './lib/startup-recovery';
import {isHomepageRequest} from './lib/homepage-request';
import {NavigationRecovery} from './components/NavigationRecovery';
import {hostedStoreOrigin} from './lib/hosted-store';
import {HomepageHeroPreload} from './components/HomepageHeroPreload';
import trackingSettings from './content/tracking.json';
import {trackingEnabled} from './lib/tracking';
import {TrackingHead,TrackingEvents} from './components/Tracking';
import {loadSiteGtm} from './lib/tracking.client';
import {SeoHead} from './components/SeoHead';
import seoSite from './content/seo-site.json';
import {indexingEnabled} from './lib/seo';
import {getStoreNavigation,getNavigationSnapshot} from './lib/navigation.server';
import {StoreNavigationProvider} from './components/StoreNavigationProvider';
import {WishlistProvider} from './components/WishlistProvider';
import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, isRouteErrorResponse, useRouteError,type ShouldRevalidateFunctionArgs,useNavigation} from 'react-router';
import {useEffect,useState,type ReactNode,type CSSProperties} from 'react';
import {settings} from './settings';
import {CartProvider} from './components/CartProvider';
import {StoreLayout} from './components/StoreLayout';
import {BannerSettingsProvider} from './components/BannerSettingsProvider';
import './styles/app.css';
import {storefrontMiddleware} from './storefront.middleware.server';
import type {Route} from './+types/root';
import {getHomepageSettings} from './lib/homepage.server';
import {environmentContext} from './storefront.context';

// Google runs only through GTM-56L6HTJ9 (owner's decision, 20 Nov): the site loads no Google tag IDs of its own.
const GTM_INIT="window.dataLayer = window.dataLayer || [];\n  window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});";
export const middleware: Route.MiddlewareFunction[] = [storefrontMiddleware];

export async function loader({context,request}:Route.LoaderArgs) {const env=context.get(environmentContext);const navigation=getNavigationSnapshot(env),navigationPending=getStoreNavigation(env);const homepage=await (isHomepageRequest(request.url)?getHomepageSettings(env):Promise.resolve({banners:[],influencers:{enabled:false,heading:"Style in Motion",reels:[]}}));return {navigationPending,hostedStoreOrigin:hostedStoreOrigin(env),tracking:{...trackingSettings,enabled:trackingEnabled(request,env)},seo:{...seoSite,indexingEnabled:indexingEnabled(request,env,seoSite.origin),requestOrigin:new URL(request.url).origin,logo:settings.logo,socials:settings.socials.map(link=>link.href)},settings:{...settings,...navigation},banners:homepage.banners,influencers:homepage.influencers};}
export function shouldRevalidate({currentUrl,nextUrl,formMethod,defaultShouldRevalidate}:ShouldRevalidateFunctionArgs){if(formMethod&&formMethod.toUpperCase()!=='GET')return defaultShouldRevalidate;if(currentUrl.pathname!==nextUrl.pathname)return nextUrl.pathname==='/';if(currentUrl.search!==nextUrl.search)return false;return defaultShouldRevalidate;}

export function Layout({children}: {children: ReactNode}) {
  return <html lang="en"><head><meta charSet="utf-8"/>{/* Google Tag Manager GTM-56L6HTJ9: dataLayer and gtm.start start here; gtm.js itself loads through the third-party gate (loadSiteGtm in App), so it never delays the first taps. */}<script id="equator-gtm-init" dangerouslySetInnerHTML={{__html:GTM_INIT}}/><script id="equator-early-add" dangerouslySetInnerHTML={{__html:EARLY_ADD_SCRIPT}}/><script id="equator-early-menu" dangerouslySetInnerHTML={{__html:EARLY_MENU_SCRIPT}}/><script id="equator-startup-recovery" dangerouslySetInnerHTML={{__html:'('+installStartupRecovery.toString()+')(window);'}}/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="preconnect" href="https://cdn.shopify.com"/><HomepageHeroPreload/><link rel="icon" href="/favicon.ico?v=20261120" sizes="16x16 32x32 48x48"/><link rel="icon" type="image/png" sizes="48x48" href="/images/equator-icon-20261120-48.png?v=20261120"/><link rel="icon" type="image/png" sizes="96x96" href="/images/equator-icon-20261120-96.png?v=20261120"/><link rel="icon" type="image/png" sizes="192x192" href="/images/equator-icon-20261120-192.png?v=20261120"/><link rel="apple-touch-icon" sizes="180x180" href="/images/equator-apple-touch-icon-20261120.png?v=20261120"/><Meta/><SeoHead/><TrackingHead/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>;
}

export default function App() {
  const loaded = useLoaderData<typeof loader>();
  const [navigation,setNavigation]=useState({menu:loaded.settings.menu,collectionGroups:loaded.settings.collectionGroups});
  useEffect(()=>{markHydrated();preloadRouteModules();loadSiteGtm();},[]);
  const routeNavigation=useNavigation();
  useEffect(()=>{(window as Window&{__equatorNavigating?:boolean}).__equatorNavigating=routeNavigation.state!=='idle';},[routeNavigation.state]);
  useEffect(()=>{let active=true;void loaded.navigationPending.then(value=>{if(active)setNavigation(value);});return()=>{active=false;};},[loaded.navigationPending]);
  const data={...loaded,settings:{...loaded.settings,...navigation}};
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
  return <div style={theme}><StoreNavigationProvider menu={data.settings.menu} collectionGroups={data.settings.collectionGroups}><BannerSettingsProvider initialBanners={data.banners}><WishlistProvider><CartProvider><NavigationRecovery/><TrackingEvents config={data.tracking}/><StoreLayout hostedStoreOrigin={data.hostedStoreOrigin} settings={data.settings}><Outlet/></StoreLayout></CartProvider></WishlistProvider></BannerSettingsProvider></StoreNavigationProvider></div>;
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <main className="error-page"><h1>{isRouteErrorResponse(error) ? error.status : 'Something went wrong'}</h1><a href="/">Return to Equator</a></main>;
}

