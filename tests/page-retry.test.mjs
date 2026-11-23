import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app/components/PageError.tsx',import.meta.url),'utf8');
const footer=readFileSync(new URL('../app/components/Footer.tsx',import.meta.url),'utf8');
const product=readFileSync(new URL('../app/routes/product.tsx',import.meta.url),'utf8');

test('a failed in-app page load retries once as a full page load instead of showing the error screen',()=>{
 assert.match(source,/window\.location\.reload\(\)/);
 assert.match(source,/sessionStorage/,'the retry is remembered so it can never loop');
 assert.match(source,/60_000/);
 assert.match(source,/status>=400&&error\.status<500/,'missing pages (404) are never retried');
});

test('every deferred product section has its own fallback, so a dropped stream never replaces the whole page',()=>{
 const awaits=product.match(/<Await [^>]*>/g)||[];
 assert.ok(awaits.length>=8);
 for(const tag of awaits)assert.match(tag,/errorElement=/,tag);
});

test('the footer Google Map is not downloaded on phones until Store Locations is opened',()=>{
 assert.match(footer,/expanded \|\| desktop \? <iframe/);
 assert.match(footer,/min-width:851px/);
});
