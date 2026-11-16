import {useLocation,useRouteLoaderData} from 'react-router';
import type {loader} from '../root';
import {campaignImageSources} from '../lib/campaign-images';

export function HomepageHeroPreload(){
 const {pathname}=useLocation(),data=useRouteLoaderData<typeof loader>('root');
 const banner=pathname==='/'?data?.banners[0]:undefined;
 if(!banner)return null;
 const {desktop,mobile}=campaignImageSources(banner);
 return <><link rel="preload" as="image" media="(max-width:850px)" href={mobile.src} imageSrcSet={mobile.srcSet} imageSizes={mobile.sizes} fetchPriority="high"/><link rel="preload" as="image" media="(min-width:851px)" href={desktop.src} imageSrcSet={desktop.srcSet} imageSizes={desktop.sizes} fetchPriority="high"/></>;
}
