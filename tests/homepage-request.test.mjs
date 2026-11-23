import test from 'node:test';
import assert from 'node:assert/strict';
import {isHomepageRequest} from '../app/lib/homepage-request.ts';
test('homepage settings load for documents and client data navigations only',()=>{
 for(const path of ['/','/?utm_source=facebook','/_.data','/_root.data?_routes=root,routes/home'])assert.equal(isHomepageRequest('https://equatorstores.com'+path),true);
 for(const path of ['/collections/winter-2026','/collections/winter-2026.data','/products/a.data','/resources/pairings'])assert.equal(isHomepageRequest('https://equatorstores.com'+path),false);
});
