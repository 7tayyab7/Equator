import test from 'node:test';import assert from 'node:assert/strict';import {legacyTarget,resolveShopifyRedirect} from '../app/lib/seo-redirects.ts';
test('legacy collection-product URLs retain variant selection with a 301 destination',()=>{assert.equal(legacyTarget(new URL('https://preview.example/collections/casual/products/shirt?variant=11')),'/products/shirt?variant=11');assert.equal(legacyTarget(new URL('https://preview.example/products')),'/collections/all');});
test('merchant redirects resolve chains locally in staging and keep request parameters',()=>{const rows=[{path:'/old',target:'https://equatorstores.com/middle'},{path:'/middle',target:'/products/new'}];assert.equal(resolveShopifyRedirect(new URL('https://preview.example/old?variant=12'),rows),'/products/new?variant=12');});
test('redirect loops and unsafe schemes never become redirects',()=>{for(const rows of [[{path:'/a',target:'/b'},{path:'/b',target:'/a'}],[{path:'/a',target:'javascript:alert(1)'}]])assert.equal(resolveShopifyRedirect(new URL('https://preview.example/a'),rows),null);});
test('merchant external HTTPS redirects remain external and unknown paths remain real 404s',()=>{assert.equal(resolveShopifyRedirect(new URL('https://preview.example/a'),[{path:'/a',target:'https://example.org/new'}]),'https://example.org/new');assert.equal(resolveShopifyRedirect(new URL('https://preview.example/unknown'),[]),null);});
test('trailing slashes and former Shopify sitemap links have permanent destinations',()=>{assert.equal(legacyTarget(new URL('https://preview.example/collections/shirts/?page=2')),'/collections/shirts?page=2');assert.equal(legacyTarget(new URL('https://preview.example/sitemap_products_1.xml?from=1')),'/sitemap.xml');});

test('double-slash request paths never become protocol-relative open redirects',()=>{assert.equal(legacyTarget(new URL('https://preview.example//evil.example/')),null);});

test('legacy checkout-domain shopping redirects retain attribution on Hydrogen without changing hosted checkout',()=>{
 assert.equal(resolveShopifyRedirect(new URL('https://equatorstores.com/old?variant=123&utm_source=facebook'),[{path:'/old',target:'https://checkout.equatorstores.com/products/shirt'}]),'/products/shirt?variant=123&utm_source=facebook');
 assert.equal(resolveShopifyRedirect(new URL('https://equatorstores.com/old'),[{path:'/old',target:'https://checkout.equatorstores.com/checkouts/example'}]),'https://checkout.equatorstores.com/checkouts/example');
});
