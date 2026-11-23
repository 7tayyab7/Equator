import test from 'node:test';import assert from 'node:assert/strict';
import {preloadAssets,routeForHref} from '../app/lib/route-preload.client.ts';

test('collection, product and search code and stylesheets come from the deployment manifest, without duplicates',()=>{
 const manifest={routes:{'routes/collection':{module:'/a/c.js',imports:['/a/shared.js','/a/filters.js'],css:['/a/c.css']},'routes/product':{module:'/a/p.js',imports:['/a/shared.js']},'routes/home':{module:'/a/h.js'}}};
 assert.deepEqual(preloadAssets(manifest),{scripts:['/a/c.js','/a/shared.js','/a/filters.js','/a/p.js'],styles:['/a/c.css']});
 assert.deepEqual(preloadAssets(undefined),{scripts:[],styles:[]});
});

test('hovered or touched links are matched to the page whose code should start downloading',()=>{
 assert.equal(routeForHref('/collections/blazers?menu=formal'),'routes/collection');
 assert.equal(routeForHref('/products/high-neck-fs-w26-st-06-navy'),'routes/product');
 assert.equal(routeForHref('/search?q=jacket'),'routes/search');
 for(const other of ['/','/pages/contact','/collections','https://equatorstores.com/collections/x',null])assert.equal(routeForHref(other),null,String(other));
});

import fs from 'node:fs';import {HANDLE_PATTERN} from '../app/lib/handle.ts';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('one handle rule shared everywhere a handle is checked',()=>{
 for(const f of ['app/lib/content.server.ts','app/lib/product-helpers.ts','app/routes/product-pairings.ts','app/routes/quick-add.ts','app/lib/product.server.ts','app/lib/collection.server.ts'])assert.doesNotMatch(read(f),/\/\^\[a-z0-9-\]\{1,255\}\$\/\.test\(handle\)/,f);
 assert.equal(HANDLE_PATTERN.test('blazers'),true);assert.equal(HANDLE_PATTERN.test('Bad Handle'),false);
});
test('product page computes the purchase button state once; card widths come from one list',()=>{
 const pdp=read('app/routes/product.tsx');assert.equal((pdp.match(/disabled=\{purchaseDisabled\}/g)||[]).length,3);assert.equal((pdp.match(/\{addButtonText\}/g)||[]).length,2);
 for(const f of ['app/components/ProductCard.tsx','app/components/CardGallery.tsx'])assert.match(read(f),/CARD_IMAGE_WIDTHS/,f);
});
import {galleryImage,GALLERY_IMAGE_SIZES} from '../app/lib/images.ts';
test('a pressed product card preloads the exact photo file the product gallery will request',()=>{
 const card='https://cdn.shopify.com/s/files/1/0435/3713/7815/files/a.jpg?v=1&width=400';
 const gallery=galleryImage('https://cdn.shopify.com/s/files/1/0435/3713/7815/files/a.jpg?v=1');
 assert.deepEqual(galleryImage(card),gallery);assert.equal(gallery.sizes,GALLERY_IMAGE_SIZES);
 assert.match(read('app/components/ProductGallery.tsx'),/\{\.\.\.galleryImage\(image\.url\)\}/);
});
