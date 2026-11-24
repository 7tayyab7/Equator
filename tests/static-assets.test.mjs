import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {staticAsset,staticRedirect} from '../app/lib/static-assets.ts';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('site files are bundled from app/static, so no public/ folder is served by the static file layer',()=>{
 assert.equal(fs.existsSync(new URL('../public',import.meta.url)),false,'public/ must stay empty: its files bypass server.ts and carry alt-svc h3');
 for(const f of ['images/payments/visa.svg','images/equator-wordmark-2026.png','favicon.ico','images/banners/campaign-1-mobile-440.webp'])assert.ok(fs.existsSync(new URL('../app/static/'+f,import.meta.url)),f);
 assert.match(read('app/lib/static-assets.ts'),/import\.meta\.glob\('\.\.\/static\/\*\*\/\*',\{query:'\?url',import:'default',eager:true\}\)/);
});

test('without a bundle map (unit tests) paths are left unchanged; unknown values are never rewritten',()=>{
 assert.equal(staticAsset('/images/payments/visa.svg'),'/images/payments/visa.svg');
 assert.equal(staticAsset('https://cdn.shopify.com/x.jpg'),'https://cdn.shopify.com/x.jpg');
 assert.equal(staticRedirect('/collections/casual'),null);
});

test('every page reference to a site file goes through staticAsset',()=>{
 for(const [file,needle] of [['app/components/PaymentMethods.tsx',"staticAsset('/images/payments/visa.svg')"],['app/components/BaadmayWidget.tsx',"staticAsset('/images/payments/baadmay.svg')"],['app/routes/product.tsx',"staticAsset('/images/equator-wordmark-2026.png')"],['app/components/Influencers.tsx',"staticAsset('/images/equator-card-sign.png')"],['app/root.tsx',"staticAsset('/favicon.ico?v=20261120')"],['app/lib/images.ts','if(!url)return staticAsset(value);'],['app/lib/campaign-images.ts','staticAsset(`/images/banners/campaign-${banner.mobileImage}-mobile-440.webp`)']])assert.ok(read(file).includes(needle),`${file}: ${needle}`);
});

test('old /images addresses redirect permanently, before the Pakistan-only guard (they were public before), with Alt-Svc: clear',()=>{
 const server=read('server.ts');
 const redirect=server.indexOf('staticRedirect(new URL(request.url).pathname)'),guard=server.indexOf('withPakistanOnly(request, env');
 assert.ok(redirect>0&&redirect<guard,'redirect runs before the geo guard');
 assert.match(server,/if\(moved\)return withoutHttp3\(new Response\(null,\{status:301,headers:\{Location:moved,'Cache-Control':'public, max-age=86400'\}\}\)\);/);
});
