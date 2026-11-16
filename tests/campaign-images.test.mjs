import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignImageSources} from '../app/lib/campaign-images.ts';

test('hero preload candidates are constrained to supplied artwork on both devices',()=>{
 const images=campaignImageSources({desktopImageUrl:'https://cdn.shopify.com/a.jpg?v=7',desktopImageWidth:1920,desktopImageHeight:850,mobileImageUrl:'https://cdn.shopify.com/b.jpg?v=8',mobileImageWidth:750,mobileImageHeight:1100});
 assert.equal(images.desktop.srcSet.split(', ').at(-1),'https://cdn.shopify.com/a.jpg?v=7&width=1920 1920w');
 assert.equal(images.mobile.srcSet.split(', ').at(-1),'https://cdn.shopify.com/b.jpg?v=8&width=750 750w');
 assert.equal(images.desktop.height,850);assert.equal(images.mobile.height,1100);assert.equal(images.desktop.sizes,images.mobile.sizes);
});
test('fallback hero artwork remains available without Shopify image URLs',()=>{
 const images=campaignImageSources({desktopImage:2,mobileImage:3});
 assert.equal(images.desktop.src,'/images/banners/campaign-2-desktop-1728.webp');assert.equal(images.mobile.srcSet,'/images/banners/campaign-3-mobile-440.webp');
});
