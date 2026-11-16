import type {BannerSettings} from '../content/banners';
import {imageSrcSet,shopifyImageURL} from './images.ts';

/** Keep the head preload and the visible picture on exactly the same candidates. */
export function campaignImageSources(banner:BannerSettings){
 const desktop={src:banner.desktopImageUrl?shopifyImageURL(banner.desktopImageUrl,1920):`/images/banners/campaign-${banner.desktopImage}-desktop-1728.webp`,srcSet:banner.desktopImageUrl?imageSrcSet(banner.desktopImageUrl,[960,1280,1600,1920,2560,3200,3840],banner.desktopImageWidth):[960,1440,1728].map(width=>`/images/banners/campaign-${banner.desktopImage}-desktop-${width}.webp ${width}w`).join(', '),sizes:'100vw',width:banner.desktopImageWidth||1728,height:banner.desktopImageHeight||1035};
 const mobile={src:banner.mobileImageUrl?shopifyImageURL(banner.mobileImageUrl,780):`/images/banners/campaign-${banner.mobileImage}-mobile-440.webp`,srcSet:banner.mobileImageUrl?imageSrcSet(banner.mobileImageUrl,[390,600,780,960,1200],banner.mobileImageWidth)||banner.mobileImageUrl:`/images/banners/campaign-${banner.mobileImage}-mobile-440.webp`,sizes:'100vw',width:banner.mobileImageWidth||440,height:banner.mobileImageHeight||901};
 return {desktop,mobile};
}
