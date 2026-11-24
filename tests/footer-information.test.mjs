import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const footer=fs.readFileSync(new URL('../app/components/Footer.tsx',import.meta.url),'utf8');

test('footer column is titled "Information" and ends with a Store Locator link to /pages/store-locations',()=>{
 assert.match(footer,/<FooterGroup id="footer-order-information" title="Information">/);
 assert.doesNotMatch(footer,/title="Order Information"/);
 assert.match(footer,/const STORE_LOCATOR=\{title:'Store Locator',href:'\/pages\/store-locations'\};/);
 assert.match(footer,/const informationLinks = \[\.\.\.orderLinks\.filter\(link => link\.href !== STORE_LOCATOR\.href\), STORE_LOCATOR\];/);
 assert.match(footer,/\{informationLinks\.map\(link => <Link key=\{link\.href\} to=\{link\.href\}>\{link\.title\}<\/Link>\)\}/);
});
