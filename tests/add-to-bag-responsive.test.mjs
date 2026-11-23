import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {EARLY_ADD_SCRIPT,takeEarlyAdd,markHydrated} from '../app/lib/early-add.ts';
const provider=fs.readFileSync(new URL('../app/components/CartProvider.tsx',import.meta.url),'utf8');
const pdp=fs.readFileSync(new URL('../app/routes/product.tsx',import.meta.url),'utf8');
const route=fs.readFileSync(new URL('../app/routes/cart.ts',import.meta.url),'utf8');
const quick=fs.readFileSync(new URL('../app/components/QuickAdd.tsx',import.meta.url),'utf8');
test('Add to bag is never disabled just because the bag is still loading',()=>{
 assert.doesNotMatch(pdp,/disabled=\{!ready/);assert.doesNotMatch(quick,/disabled=\{!ready/);
 assert.match(provider,/async function update\(input:Record<string,string>\)\{if\(lock\.current\)return false;/);
 assert.match(provider,/if\(!ready\)\{initialLoad\.current\?\.abort\(\);setReady\(true\);\}/);
});
test('the add request is sent before the screen re-renders',()=>{
 assert.match(provider,/const pending=requestJSON<CartResponse>\('\/resources\/cart',\{method:'POST'[^;]*;setBusy\(true\)/);
});
test('existing bags: one Shopify request per add; the bag check only runs when the add fails',()=>{
 assert.doesNotMatch(route,/if\(id&&action==='add'&&!await readCart/);
 assert.match(route,/catch\(error\)\{if\(!\(id&&action==='add'\)\)throw error;const existing=await readCart/);
 assert.match(route,/if\(existing\)throw error;result=await changeCart\(env,null,input/);
});
test('a tap before the page is ready is remembered and replayed once for that product only',()=>{
 globalThis.document={documentElement:{classList:{add(){},remove(){}}},addEventListener(){}};globalThis.window=globalThis;
 assert.match(EARLY_ADD_SCRIPT,/\[data-add-to-bag\]/);
 window.__equatorEarlyAdd='gid://shopify/Product/1';
 assert.equal(takeEarlyAdd('gid://shopify/Product/2'),false,'other product: not replayed');
 window.__equatorEarlyAdd='gid://shopify/Product/1';
 assert.equal(takeEarlyAdd('gid://shopify/Product/1'),true);assert.equal(takeEarlyAdd('gid://shopify/Product/1'),false,'only once');
 markHydrated();assert.equal(window.__equatorHydrated,true);
 assert.match(pdp,/useEffect\(\(\)=>\{if\(takeEarlyAdd\(product\.id\)\)void add\(\);\},\[\]\);/);
});
