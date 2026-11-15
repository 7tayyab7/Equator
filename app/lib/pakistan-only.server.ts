import ipaddr from 'ipaddr.js';

export interface PakistanOnlyEnv {
  PK_ONLY_ENABLED?: string;
  PK_ONLY_ALLOW_SEARCH_BOTS?: string;
}

type Cidr = ReturnType<typeof ipaddr.parseCIDR>;
type RangeCache = {ranges: Cidr[]; expiresAt: number};

// Fixed official feeds only. Never take a feed URL from the incoming request.
const GOOGLE =
  'https://developers.google.com/static/crawling/ipranges/common-crawlers.json';
const GOOGLE_ADS =
  'https://developers.google.com/static/crawling/ipranges/special-crawlers.json';
const BING = 'https://www.bing.com/toolbox/bingbot.json';

const TTL_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
// Only completed, non-I/O values are shared across requests in an Oxygen isolate.
const rangeCache = new Map<string, RangeCache>();
const retryAfter = new Map<string, number>();

function crawlerFeed(userAgent: string): string | undefined {
  if (/\bAdsBot-Google(?:-Mobile)?\b/i.test(userAgent)) return GOOGLE_ADS;
  if (/\b(?:Googlebot(?:-Image|-Video|-News)?|Google-InspectionTool|Storebot-Google)\b/i.test(userAgent)) {
    return GOOGLE;
  }
  if (/\bbingbot\b/i.test(userAgent)) return BING;
  return undefined;
}

async function getRanges(url: string): Promise<Cidr[]> {
  const cached = rangeCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.ranges;
  if ((retryAfter.get(url) ?? 0) > Date.now()) {
    throw new Error('Crawler verification temporarily unavailable');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error',
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) throw new Error('Crawler feed unavailable');
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || !('prefixes' in body) ||
        !Array.isArray(body.prefixes) || body.prefixes.length === 0 ||
        body.prefixes.length > 10000) {
      throw new Error('Invalid crawler feed');
    }
    const ranges: Cidr[] = body.prefixes.map((entry: unknown) => {
      if (!entry || typeof entry !== 'object') throw new Error('Invalid prefix');
      const prefix = 'ipv4Prefix' in entry ? entry.ipv4Prefix :
        'ipv6Prefix' in entry ? entry.ipv6Prefix : undefined;
      if (typeof prefix !== 'string') throw new Error('Invalid prefix');
      const range = ipaddr.parseCIDR(prefix);
      if (range[1] === 0) throw new Error('Refusing universal crawler range');
      return range;
    });
    rangeCache.set(url, {ranges, expiresAt: Date.now() + TTL_MS});
    retryAfter.delete(url);
    return ranges;
  } catch {
    retryAfter.set(url, Date.now() + RETRY_MS);
    throw new Error('Crawler verification temporarily unavailable');
  } finally {
    clearTimeout(timer);
  }
}

async function isVerifiedCrawler(request: Request, url: string): Promise<boolean> {
  // Oxygen supplies these headers. Do not use client query parameters or X-Forwarded-For.
  const rawIp = request.headers.get('oxygen-buyer-ip')?.trim();
  if (!rawIp || !ipaddr.isValid(rawIp)) return false;
  const address = ipaddr.process(rawIp); // Also handles IPv4-mapped IPv6.
  const ranges = await getRanges(url);
  return ranges.some(([network, bits]) => {
    if (address instanceof ipaddr.IPv4 && network instanceof ipaddr.IPv4) {
      return address.match(network, bits);
    }
    if (address instanceof ipaddr.IPv6 && network instanceof ipaddr.IPv6) {
      return address.match(network, bits);
    }
    return false;
  });
}

function noPageCache(response: Response, decision: string): Response {
  // Preserve the body stream, status, redirects, and all existing cookies.
  const result = new Response(response.body, response);
  result.headers.set('Cache-Control', 'private, no-store');
  result.headers.set('CDN-Cache-Control', 'no-store');
  result.headers.delete('Oxygen-Cache-Control');
  result.headers.delete('Cloudflare-CDN-Cache-Control');
  result.headers.set('X-Equator-Geo-Rule', decision);
  return result;
}

function deny(request: Request, temporary = false): Response {
  const status = temporary ? 503 : 403;
  const message = temporary
    ? 'Verification is temporarily unavailable. Please try again shortly.'
    : 'Equator’s online store is currently available only within Pakistan.';
  const response = new Response(request.method === 'HEAD' ? null :
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Equator Stores</title><body><main><h1>Equator Stores</h1><p>${message}</p></main></body></html>`, {
      status,
      headers: {'Content-Type': 'text/html; charset=utf-8'},
    });
  if (temporary) response.headers.set('Retry-After', '60');
  // Standalone response: no storefront, analytics scripts, or marketing pixels.
  return noPageCache(response, temporary ? 'verification-unavailable' : 'blocked');
}

/**
 * Wrap the EXISTING Oxygen fetch-handler body. The callback must contain all
 * existing context, routing, session, redirect, and error-handling code.
 * The guard intentionally has no hostname bypass (including public Oxygen URLs).
 */
export async function withPakistanOnly(
  request: Request,
  env: PakistanOnlyEnv,
  next: () => Promise<Response>,
): Promise<Response> {
  if (env.PK_ONLY_ENABLED !== 'true') return next();

  const country = request.headers.get('oxygen-buyer-country')?.trim().toUpperCase();
  if (country === 'PK') return noPageCache(await next(), 'allowed-pk');

  // Search/advertising crawlers may read public pages; they cannot submit actions.
  const path = new URL(request.url).pathname;
  const isPublicRead = (request.method === 'GET' || request.method === 'HEAD') &&
    !/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:cart|account|api|__shopify|resources|admin|apps|tools|wallets|digital_wallets|challenge|preview-settings|checkout|checkouts)(?:[/.]|$)/i.test(path);
  const feed = env.PK_ONLY_ALLOW_SEARCH_BOTS === 'true' && isPublicRead
    ? crawlerFeed(request.headers.get('user-agent') ?? '') : undefined;

  if (feed) {
    let verified = false;
    try {
      verified = await isVerifiedCrawler(request, feed);
    } catch {
      // Never allow unverified visitors when a feed is unavailable.
      // A temporary status avoids claiming the page permanently disappeared.
      return deny(request, true);
    }
    if (verified) return noPageCache(await next(), 'allowed-crawler');
  }
  // Missing/unknown countries are denied under the strict Pakistan-only policy.
  return deny(request);
}
