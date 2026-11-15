import test from 'node:test';import assert from 'node:assert/strict';
import {ensureCookieHeaderAPI} from '../app/lib/cookie-headers.server.ts';
test('legacy Oxygen bridge preserves cookies with commas in Expires',()=>{
 class Legacy {getAll(name){assert.equal(name,'Set-Cookie');return ['cart=one; Expires=Wed, 11 Nov 2026 00:00:00 GMT','privacy=two; HttpOnly'];}}
 ensureCookieHeaderAPI(Legacy);assert.deepEqual(new Legacy().getSetCookie(),['cart=one; Expires=Wed, 11 Nov 2026 00:00:00 GMT','privacy=two; HttpOnly']);
 ensureCookieHeaderAPI(Legacy);assert.equal(new Legacy().getSetCookie().length,2);
});
test('native implementation is preserved and unsupported runtimes fail explicitly',()=>{const native=Headers.prototype.getSetCookie;ensureCookieHeaderAPI();assert.equal(Headers.prototype.getSetCookie,native);assert.throws(()=>ensureCookieHeaderAPI(class {}),/cannot preserve/);});
