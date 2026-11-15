# Equator Hydrogen storefront

Latest known production source snapshot prepared 15 November 2026, matching the recorded 10 November 2026 favicon deployment. The storefront runs on Shopify Oxygen at https://equatorstores.com. This repository upload does not deploy or change the live store. This repository contains no deployment workflow or deployment credentials. Continue using authorized manual preview deployments; do not enable automatic production deployment as part of source sharing.

## Local setup

Use Node 24 LTS (or Node 22.12+). Run npm ci, copy .env.example to .env, and supply the store-specific values securely. Then run npm run dev. Never commit .env, deployment tokens or Admin API credentials.

The pinned versions and lockfile are authoritative. This app uses Hydrogen 2026.10.1, React Router 8.4.0, React 19.3.0 and Vite 8.3.4.

## Validation

Run npm run typecheck and npm run build. With Node 24, run node --experimental-strip-types --test tests/*.test.mjs tests/*.test.ts for local regression tests. The read-only scripts/seo-preflight.mjs supports --url=https://your-preview-host/ and optional --live for canonical-domain checks.

## Configuration and Shopify content

PUBLIC_STORE_DOMAIN and PUBLIC_STOREFRONT_API_TOKEN configure the public Storefront API connection; PUBLIC_STOREFRONT_ID identifies the Hydrogen storefront. Runtime bindings must be supplied separately in Oxygen. PUBLIC_CHECKOUT_DOMAIN identifies Shopify's hosted checkout domain. SEO_INDEXING_ENABLED and TRACKING_ENABLED default off in the example: keep them off on preview. Production enabling requires verification of the canonical host, consent, analytics and indexing behaviour.

Shopify products, variants, inventory, collections, menus, policies, Files and metaobjects remain in Shopify; this repository is not a store/database backup. Existing Equator redesign metaobjects and Details metafields are consumed by app/lib readers. Credentials, merchant dashboards, API permissions, app subscriptions and external account access are not included or transferred by cloning this repository. Store-specific content and integration configuration are in app/content and app/settings.ts. Do not use Equator's tracking IDs or merchant content for a different store.

App integrations include consent-aware tracking, Kiwi size guide, Judge.me reviews, Baadmay information and Shopify cart/checkout. Their services, credentials and product assignments must be verified independently. No guarantee that every Shopify theme app runs on Hydrogen is implied.

## Deployment

Build with npm run build, then use an authorized Shopify CLI session to deploy to a separate preview first. Existing deploy:preview and deploy:client-preview commands target preview environments. Do not connect automatic production deployments merely to share source code. Review all changes and verify preview before promoting to production.

## Snapshot scope

Includes application source, public assets, dependency lockfile, configuration examples and tests. Excludes build output, node_modules, .git history, credentials, internal audit/support reports, Shopify admin receipts and migration exports. The separate traffic-protection design harness is not part of this storefront. Some regression fixtures or unused helper modules may describe preview-only experiments; their presence does not mean those features are enabled on production.

## Current production snapshot

Includes the latest emblem favicon, SKU search, collection view controls, request deadline handling, cookie-header compatibility and Pakistan-only server guard. The recorded production deployment is https://01m7308635br5vm0jbk9jdtw7a-c44fa3d9f1c9b96db824.myshopify.dev/. Runtime settings are not source code and must be obtained separately from authorized Shopify access.

The separate Kiwi size-guide improvement was tested on Client Preview only and was deliberately excluded from the favicon production release. This snapshot retains the production Kiwi component; pending preview work remains in the original workspace and must be verified before deployment.

`PK_ONLY_ENABLED=true` enables the production Pakistan-only guard; `PK_ONLY_ALLOW_SEARCH_BOTS=true` allows the supported verified Google/Google Ads/Bing crawler ranges. Other overseas visitors, including Meta/TikTok ad reviewers, remain blocked under the approved strict policy. Keep these flags disabled on a general-purpose development preview. This guard does not protect separately hosted Shopify checkout. Cloudflare DNS must remain DNS-only; do not enable a proxy in front of Oxygen. See app/lib/pakistan-only.server.ts and its tests for behavior and rollback.
