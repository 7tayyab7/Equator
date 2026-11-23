import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {EARLY_MENU_SCRIPT,takeEarlyPanel,earlyDropdownCSS} from '../app/lib/early-menu.ts';
const layout=fs.readFileSync(new URL('../app/components/StoreLayout.tsx',import.meta.url),'utf8');
const root=fs.readFileSync(new URL('../app/root.tsx',import.meta.url),'utf8');

test('top-level collection menu items are links, so a click works before the page JavaScript starts',()=>{
 assert.doesNotMatch(layout,/navigate\(collectionHref\(group\.href/);
 assert.match(layout,/group\.href\.startsWith\('\/collections\/'\) \? <Link key=\{group\.title\} \{\.\.\.dropdown\} to=\{collectionHref\(group\.href,group\.title\)\}>/);
});

test('menu panel buttons remember a tap made before the page is ready',()=>{
 assert.match(root,/<script id="equator-early-menu" dangerouslySetInnerHTML=\{\{__html:EARLY_MENU_SCRIPT\}\}\/>/);
 assert.match(layout,/className="mobile-menu-trigger icon-button" data-early-panel="menu"/);
 assert.match(layout,/className="nav-type nav-link nav-more" data-early-panel="menu"/);
 assert.match(layout,/takeEarlyPanel\(\) === 'menu'/);
 assert.match(EARLY_MENU_SCRIPT,/if\(window\.__equatorHydrated\)return;/);
});

test('the early menu script records the tapped panel and takeEarlyPanel returns it once',()=>{
 const listeners=[];const classes=new Set();
 globalThis.window=globalThis;globalThis.document={addEventListener:(type,fn)=>listeners.push(fn),documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}}};
 try{
  new Function(EARLY_MENU_SCRIPT)();
  let prevented=false;const button={getAttribute:()=>'menu'};
  listeners[0]({target:{closest:()=>button},preventDefault:()=>{prevented=true;}});
  assert.equal(prevented,true);assert.ok(classes.has('equator-early-panel'));
  assert.equal(takeEarlyPanel(),'menu');assert.equal(takeEarlyPanel(),null);assert.ok(!classes.has('equator-early-panel'));
  globalThis.__equatorHydrated=true;
  listeners[0]({target:{closest:()=>button},preventDefault:()=>{throw new Error('must not intercept after hydration');}});
  assert.equal(takeEarlyPanel(),null);
 }finally{delete globalThis.__equatorHydrated;delete globalThis.__equatorEarlyPanel;delete globalThis.document;}
});

test('dropdowns open on hover only until the page is ready, and only on desktop widths',()=>{
 const css=earlyDropdownCSS([{children:[1]},{children:[]},{children:[1]}]);
 assert.match(css,/^@layer base\{@media \(min-width:851px\)\{/);
 assert.match(css,/html:not\(\[data-equator-ready\]\) \.store-header:has\(\[aria-controls="menu-0"\]:hover,#menu-0:hover\) #menu-0\{display:grid!important\}/);
 assert.doesNotMatch(css,/menu-1/);assert.match(css,/#menu-2\{display:grid!important\}/);
 assert.equal(earlyDropdownCSS([{children:[]}]),'');
});
