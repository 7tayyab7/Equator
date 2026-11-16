# Equator Hydrogen storefront

Production source updated 16 November 2026 after the reliability audit and separate preview verification. The storefront runs on Shopify Oxygen at https://equatorstores.com. Repository updates do not deploy the live store. The GitHub workflow runs validation only and contains no deployment credentials. Continue using authorized manual preview deployments; do not enable automatic production deployment as part of source sharing.

## Local setup

Use Node 24 LTS (or Node 22.12+). Run npm ci, copy .env.example to .env, and supply the store-specific values securely. Then run npm run dev. Never commit .env, deployment tokens or Admin API credentials.

The pinned versions and lockfile are authoritative. This app uses Hydrogen 2026.10.3, React Router 8.4.0, React 19.3.1 and Vite 8.3.8.

## Validation

Run npm run check for typechecking, regression tests and the production build. The GitHub checks workflow runs the same command on Node 24 without deploying. The read-only scripts/seo-preflight.mjs supports --url=https://your-preview-host/ and optional --live for canonical-domain checks. Run npm run health:check -- --url=https://equatorstores.com --product=published-product-handle from Pakistan for real content checks. This script is not a hosted monitor or alert service.

## Configuration and Shopify content

PUBLIC_STORE_DOMAIN and PUBLIC_STOREFRONT_API_TOKEN configure the public Storefront API connection; PUBLIC_STOREFRONT_ID identifies the Hydrogen storefront. Runtime bindings must be supplied separately in Oxygen. PUBLIC_CHECKOUT_DOMAIN identifies Shopify's hosted checkout domain. SEO_INDEXING_ENABLED and TRACKING_ENABLED default off in the example: keep them off on preview. Production enabling requires verification of the canonical host, consent, analytics and indexing behaviour.

Shopify products, variants, inventory, collections, menus, policies, Files and metaobjects remain in Shopify; this repository is not a store/database backup. Existing Equator redesign metaobjects and Details metafields are consumed by app/lib readers. Credentials, merchant dashboards, API permissions, app subscriptions and external account access are not included or transferred by cloning this repository. Store-specific content and integration configuration are in app/content and app/settings.ts. Do not use Equator's tracking IDs or merchant content for a different store.

App integrations include consent-aware tracking, Kiwi size guide, Judge.me reviews, Baadmay information and Shopify cart/checkout. Their services, credentials and product assignments must be verified independently. No guarantee that every Shopify theme app runs on Hydrogen is implied.

## Deployment

Build with npm run build, then use an authorized Shopify CLI session to deploy to a separate preview first. Existing deploy:preview and deploy:client-preview commands target preview environments. Do not connect automatic production deployments merely to share source code. Review all changes and verify preview before promoting to production.

## Snapshot scope

Includes application source, public assets, dependency lockfile, configuration examples and tests. Excludes build output, node_modules, .git history, credentials, internal audit/support reports, Shopify admin receipts and migration exports. The separate traffic-protection design harness is not part of this storefront. Some regression fixtures or unused helper modules may describe preview-only experiments; their presence does not mean those features are enabled on production.

## Current production snapshot

Includes the latest emblem favicon, SKU search, collection view controls, request deadline handling, cookie-header compatibility and Pakistan-only server guard. The recorded production deployment is https://01m7hh2r6nrjrv2mvtqvynw9w3-c44fa3d9f1c9b96db824.myshopify.dev/. Runtime settings are not source code and must be obtained separately from authorized Shopify access.

The reliability release caches completed data rather than sharing unfinished server fetches across requests, bounds public rendering and browser JSON reads, rejects invalid pagination, sanitizes merchant HTML, normalizes legacy shopping links, and preserves loaded Kiwi charts across size changes. Mutations are never retried automatically on timeout. Production server sourcemaps are built separately from public client assets; the Hydrogen plugin supplies the Oxygen runtime compatibility date. Dependency overrides keep development tooling on compatible patched versions.

Before release, 196 tests, typechecking, build and 140 local route/API checks passed. Preview verified product rendering, loaded size-chart images after a size change, cart add/update/remove and the hosted checkout form without placing an order. Preserve the previous production deployment for rollback: https://01m7gasfn0g9brkw52tzk874w6-c44fa3d9f1c9b96db824.myshopify.dev/. Reverting source alone does not revert saved environment variables. Verify cookies, cart, canonical URLs and health after every production deployment.

Do not store a pending fetch Promise in a module-level cache on Oxygen. Cache completed values only; unfinished I/O belongs to its creating request. No audit guarantees zero future incidents. Account-side analytics receipts, real payment capture and individual networks need separate verification. Product ad/catalogue URLs should use equatorstores.com directly; genuine checkout URLs remain on checkout.equatorstores.com.

`PK_ONLY_ENABLED=true` enables the production Pakistan-only guard; `PK_ONLY_ALLOW_SEARCH_BOTS=true` allows the supported verified Google/Google Ads/Bing crawler ranges. Other overseas visitors, including Meta/TikTok ad reviewers, remain blocked under the approved strict policy. Keep these flags disabled on a general-purpose development preview. This guard does not protect separately hosted Shopify checkout. Cloudflare DNS must remain DNS-only; do not enable a proxy in front of Oxygen. See app/lib/pakistan-only.server.ts and its tests for behavior and rollback.
