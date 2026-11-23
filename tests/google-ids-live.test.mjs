import test from 'node:test';import assert from 'node:assert/strict';
import live from '../app/content/tracking.json' with {type:'json'};
import {googleTagSources} from '../app/lib/tracking.client.ts';
test('Google runs only through GTM-56L6HTJ9: the site configures no Google tag IDs of its own',()=>{
 assert.deepEqual(live.googleAnalyticsIds,[]);assert.deepEqual(live.googleAdsIds,[]);assert.deepEqual(live.googleTagIds,[]);
 assert.deepEqual(live.googleEventLabels,{});assert.deepEqual(googleTagSources(live),[]);
 assert.equal(live.gtmId,'GTM-56L6HTJ9');
});
test('Meta, TikTok and Snapchat pixels are unchanged',()=>{
 assert.equal(live.metaPixelId,'1554958832889928');assert.equal(live.tiktokPixelId,'D1LRKN3C77U7P8J6OEL0');assert.equal(live.snapPixelId,'3337da2b-1b7c-491b-b7f8-afb5fc0986c7');
});
