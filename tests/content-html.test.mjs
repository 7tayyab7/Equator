import test from 'node:test';import assert from 'node:assert/strict';
import {cleanContent,contentLink} from '../app/lib/content-html.server.ts';
test('content strips executable legacy markup and inline styling',()=>{const html=cleanContent('<p style="color:red" onclick="alert(1)">Original copy</p><script>alert(1)</script><form action="https://evil.test"><input name="secret">Do not submit</form>');assert.match(html,/Original copy/);assert.doesNotMatch(html,/script|onclick|style=|<form|<input|Do not submit/);});
test('original policy lists, tables and safe links survive',()=>{const html=cleanContent('<h1>Policy</h1><ol><li>Original wording</li></ol><table><tr><td colspan="2">Store address</td></tr></table><a href="https://equatorstores.com/pages/contact">Contact</a>');assert.match(html,/<h2>Policy/);assert.match(html,/<li>Original wording/);assert.match(html,/colspan="2"/);assert.match(html,/href="\/pages\/contact"/);});
test('content links keep local navigation and preserve hosted account destinations',()=>{assert.equal(contentLink('https://equatorstores.com/collections/all/products/shirt?variant=123'),'/products/shirt?variant=123');assert.equal(contentLink('/account'),'https://equatorstores.com/account');assert.equal(contentLink('javascript:alert(1)'),'');assert.equal(contentLink('mailto:customer@equatorstores.com'),'mailto:customer@equatorstores.com');});
test('media is lazy, resized from placeholders and iframe hosts are restricted',()=>{const html=cleanContent('<img data-src="//cdn.shopify.com/image.jpg?width=1" onerror="alert(1)"><iframe src="https://evil.test/embed"></iframe><iframe src="https://www.youtube.com/embed/abc"></iframe>');assert.match(html,/width=1200/);assert.match(html,/loading="lazy"/);assert.doesNotMatch(html,/onerror|evil.test/);assert.match(html,/www.youtube.com/);});

test('legacy checkout-domain shopping links stay in Hydrogen while real checkout/account links stay hosted',()=>{
 assert.equal(contentLink('https://checkout.equatorstores.com/products/shirt?variant=123'),'/products/shirt?variant=123');
 assert.equal(contentLink('https://checkout.equatorstores.com/collections/winter-2026'),'/collections/winter-2026');
 assert.equal(contentLink('https://checkout.equatorstores.com/account/login'),'https://equatorstores.myshopify.com/account/login');
 assert.equal(contentLink('https://checkout.equatorstores.com/checkouts/example?step=1'),'https://equatorstores.myshopify.com/checkouts/example?step=1');
});
