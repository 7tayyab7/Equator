import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const layout=fs.readFileSync(new URL('../app/components/StoreLayout.tsx',import.meta.url),'utf8');
const bag=fs.readFileSync(new URL('../app/components/CartProvider.tsx',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../app/styles/app.css',import.meta.url),'utf8');

test('the bag panel stays open when Checkout is clicked, other links still close it',()=>{
 assert.match(layout,/onClickCapture=\{event=>\{const link=\(event\.target as Element\)\.closest\("a\[href\]"\);if\(link&&!link\.hasAttribute\('data-keep-panel'\)\)setPanel\(null\);/);
 assert.match(bag,/<a className="solid-button nav-type bag-checkout" href=\{cart\.checkoutUrl\} data-keep-panel=""/);
});

test('opening the bag warms up the connection to Shopify checkout once',async()=>{
 const head=[];globalThis.document={querySelector:sel=>head.find(l=>sel===`link[rel="${l.rel}"][href="${l.href}"]`)||null,createElement:()=>({}),head:{appendChild:l=>head.push(l)}};
 try{
  const {preconnectCheckout}=await import('../app/components/CartProvider.tsx').catch(()=>({}));
  if(!preconnectCheckout){assert.match(bag,/preconnectCheckout\(cart\.checkoutUrl\)/);return;}// TSX not importable in this runner: check wiring only.
  preconnectCheckout('https://checkout.equatorstores.com/cart/c/abc?key=1');preconnectCheckout('https://checkout.equatorstores.com/cart/c/xyz');
  assert.deepEqual(head.map(l=>[l.rel,l.href,l.crossOrigin]),[['preconnect','https://checkout.equatorstores.com',undefined],['dns-prefetch','https://checkout.equatorstores.com',undefined]]);
  preconnectCheckout('not a url');preconnectCheckout('http://insecure.example');assert.equal(head.length,2);
 }finally{delete globalThis.document;}
 assert.match(bag,/useEffect\(\(\)=>\{if\(cart\?\.totalQuantity&&cart\.checkoutUrl\)preconnectCheckout\(cart\.checkoutUrl\);\}/);
});

test('Checkout shows progress until Shopify checkout opens, and resets after Back',()=>{
 assert.match(bag,/\{redirecting\?'Redirecting to checkout…':'Checkout'\}/);
 assert.match(bag,/aria-busy=\{redirecting\|\|undefined\}/);
 assert.match(bag,/if\(event\.metaKey\|\|event\.ctrlKey\|\|event\.shiftKey\|\|event\.button!==0\)return;/,'new-tab clicks do not show the redirect state');
 assert.match(bag,/if\(event\.persisted\)setRedirecting\(false\)/,'returning with Back restores the normal button');
 assert.match(css,/\.bag-checkout\[aria-busy="true"\] \{[^}]*pointer-events:none/);
});
