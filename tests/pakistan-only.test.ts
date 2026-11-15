import assert from 'node:assert/strict';
import test from 'node:test';
import {withPakistanOnly} from '../app/lib/pakistan-only.server.ts';

const enabled = {PK_ONLY_ENABLED: 'true', PK_ONLY_ALLOW_SEARCH_BOTS: 'true'};
const request = (country = 'US', extra: HeadersInit = {}, method = 'GET', path = '/') =>
  new Request(`https://equatorstores.com${path}`, {
    method,
    headers: {'oxygen-buyer-country': country, ...extra},
  });
const google = {'user-agent': 'Googlebot/2.1', 'oxygen-buyer-ip': '192.0.2.15'};

test('Equator Pakistan-only guard (mocked metadata and official-feed responses)', async (t) => {
  let feedCalls = 0;
  let unavailable = false;
  let malformed = false;
  const clock = Date.now();
  let now = clock;
  const fetchMock = t.mock.method(globalThis, 'fetch', async (input: unknown) => {
    feedCalls++;
    const url = String(input);
    assert.match(url, /^https:\/\/(developers\.google\.com\/static\/crawling\/ipranges\/(?:common|special)-crawlers\.json|www\.bing\.com\/toolbox\/bingbot\.json)$/);
    if (unavailable) throw new Error('Mock feed outage');
    if (malformed) return Response.json({prefixes: [{ipv4Prefix: '0.0.0.0/0'}]});
    return Response.json({prefixes: [
      {ipv4Prefix: url.includes('special-') ? '198.51.100.0/24' : '192.0.2.0/24'},
      {ipv6Prefix: '2001:db8:1::/48'},
    ]});
  });
  t.mock.method(Date, 'now', () => now);
  const never = async (): Promise<Response> => {throw new Error('Application must not run');};
  const normal = async () => new Response('storefront');

  await t.test('disabled mode preserves original response and does no lookup', async () => {
    const original = new Response('original', {headers: {'Cache-Control': 'private'}});
    assert.equal(await withPakistanOnly(request(), {}, async () => original), original);
    assert.equal(feedCalls, 0);
  });
  await t.test('Pakistani request runs application without a feed lookup', async () => {
    const r = await withPakistanOnly(request('PK'), enabled, normal);
    assert.equal(r.status, 200);
    assert.equal(await r.text(), 'storefront');
    assert.equal(r.headers.get('X-Equator-Geo-Rule'), 'allowed-pk');
    assert.equal(feedCalls, 0);
  });
  await t.test('Pakistani POST proceeds', async () => {
    assert.equal((await withPakistanOnly(request('PK', {}, 'POST', '/cart'), enabled, normal)).status, 200);
  });
  await t.test('country case is normalized', async () => {
    assert.equal((await withPakistanOnly(request('pk'), enabled, normal)).status, 200);
  });
  await t.test('overseas visitor blocked before rendering', async () => {
    const r = await withPakistanOnly(request(), enabled, never);
    assert.equal(r.status, 403);
    const html = await r.text();
    assert.match(html, /only within Pakistan/);
    assert.doesNotMatch(html, /<script|googletagmanager|facebook\.net|tiktok|trekkie/i);
  });
  await t.test('unknown and missing countries denied', async () => {
    for (const country of ['', 'XX', 'T1', 'PK,US']) {
      assert.equal((await withPakistanOnly(request(country), enabled, never)).status, 403);
    }
    assert.equal((await withPakistanOnly(new Request('https://equatorstores.com'), enabled, never)).status, 403);
  });
  await t.test('fake ordinary client headers and query cannot select Pakistan', async () => {
    const r = await withPakistanOnly(request('US', {'cf-ipcountry': 'PK', 'X-Forwarded-For': '192.0.2.15'}, 'GET', '/?country=PK'), enabled, never);
    assert.equal(r.status, 403);
  });
  await t.test('official-feed IPv4 Google crawler allowed', async () => {
    const r = await withPakistanOnly(request('US', google), enabled, normal);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('X-Equator-Geo-Rule'), 'allowed-crawler');
    assert.equal(feedCalls, 1);
  });
  await t.test('IPv6 and mapped IPv4 crawler addresses allowed', async () => {
    for (const ip of ['2001:db8:1::a', '::ffff:192.0.2.15']) {
      assert.equal((await withPakistanOnly(request('US', {...google, 'oxygen-buyer-ip': ip}), enabled, normal)).status, 200);
    }
  });
  await t.test('fresh completed crawler ranges are reused', async () => {
    await withPakistanOnly(request('US', google), enabled, normal);
    assert.equal(feedCalls, 1);
  });
  await t.test('existing application errors are not mislabeled as crawler failures', async () => {
    await assert.rejects(withPakistanOnly(request('US', google), enabled, async () => {
      throw new Error('Original application error');
    }), /Original application error/);
  });
  await t.test('spoofed Google user-agent and out-of-range addresses denied', async () => {
    for (const ip of ['203.0.113.8', '2001:db8:2::a', 'bad-ip', '']) {
      assert.equal((await withPakistanOnly(request('US', {...google, 'oxygen-buyer-ip': ip}), enabled, never)).status, 403);
    }
  });
  await t.test('Google IP without recognized crawler user-agent denied', async () => {
    assert.equal((await withPakistanOnly(request('US', {'oxygen-buyer-ip': '192.0.2.15', 'user-agent': 'Mozilla/5.0'}), enabled, never)).status, 403);
  });
  await t.test('Google AdsBot uses a separate official feed', async () => {
    const ads = {'user-agent': 'AdsBot-Google-Mobile', 'oxygen-buyer-ip': '198.51.100.12'};
    assert.equal((await withPakistanOnly(request('US', ads), enabled, normal)).status, 200);
    assert.equal((await withPakistanOnly(request('US', {...ads, 'oxygen-buyer-ip': '192.0.2.15'}), enabled, never)).status, 403);
  });
  await t.test('Bingbot is verified against its own official feed', async () => {
    assert.equal((await withPakistanOnly(request('US', {...google, 'user-agent': 'bingbot/2.0'}), enabled, normal)).status, 200);
  });
  await t.test('search bot exception can be explicitly disabled', async () => {
    assert.equal((await withPakistanOnly(request('US', google), {...enabled, PK_ONLY_ALLOW_SEARCH_BOTS: 'false'}, never)).status, 403);
  });
  await t.test('foreign crawlers cannot perform actions or use common private routes', async () => {
    assert.equal((await withPakistanOnly(request('US', google, 'POST'), enabled, never)).status, 403);
    for (const path of ['/cart', '/cart.json', '/account/login', '/api/cart', '/checkout', '/en-pk/account', '/en/account','/resources/cart','/resources/wishlist-products','/__shopify/api','/admin','/apps/test','/preview-settings']) {
      assert.equal((await withPakistanOnly(request('US', google, 'GET', path), enabled, never)).status, 403);
    }
  });
  await t.test('HEAD denial has no body', async () => {
    const r = await withPakistanOnly(request('US', {}, 'HEAD'), enabled, never);
    assert.equal(r.status, 403);
    assert.equal(await r.text(), '');
  });
  await t.test('redirects and multiple cookies preserved; page caching disabled', async () => {
    const headers = new Headers({Location: '/cart', 'Cache-Control': 'public, max-age=300', 'Oxygen-Cache-Control': 'public, max-age=300', 'Cloudflare-CDN-Cache-Control': 'public, max-age=300'});
    headers.append('Set-Cookie', 'a=1; Path=/; HttpOnly');
    headers.append('Set-Cookie', 'b=2; Path=/; HttpOnly');
    const original = new Response(null, {status: 302, headers});
    const r = await withPakistanOnly(request('PK'), enabled, async () => original);
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('Location'), '/cart');
    assert.deepEqual(r.headers.getSetCookie(), ['a=1; Path=/; HttpOnly', 'b=2; Path=/; HttpOnly']);
    assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(r.headers.get('CDN-Cache-Control'), 'no-store');
    assert.equal(r.headers.get('Oxygen-Cache-Control'), null);
    assert.equal(r.headers.get('Cloudflare-CDN-Cache-Control'), null);
  });
  await t.test('public Oxygen hostname does not bypass the rule', async () => {
    const r = new Request('https://example.o2.myshopify.dev/', {headers: {'oxygen-buyer-country': 'US'}});
    assert.equal((await withPakistanOnly(r, enabled, never)).status, 403);
  });
  await t.test('expired cache plus feed failure gives temporary denial and cooldown', async () => {
    now += 7 * 60 * 60 * 1000;
    unavailable = true;
    const before = feedCalls;
    const r = await withPakistanOnly(request('US', google), enabled, never);
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('Retry-After'), '60');
    assert.equal((await withPakistanOnly(request('US', google), enabled, never)).status, 503);
    assert.equal(feedCalls, before + 1);
  });
  await t.test('recovery after cooldown permits verified crawler again', async () => {
    now += 61000;
    unavailable = false;
    assert.equal((await withPakistanOnly(request('US', google), enabled, normal)).status, 200);
  });
  await t.test('universal/malformed feed is rejected instead of permitting everyone', async () => {
    now += 7 * 60 * 60 * 1000;
    malformed = true;
    assert.equal((await withPakistanOnly(request('US', {...google, 'oxygen-buyer-ip': '203.0.113.8'}), enabled, never)).status, 503);
  });
  fetchMock.mock.restore();
});
