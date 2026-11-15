import {createContext} from 'react-router';
import type {StorefrontClient,CacheInstance} from '@shopify/hydrogen';

export const storefrontContext = createContext<StorefrontClient>();
export const environmentContext = createContext<Record<string, string>>({});
export type SearchCacheRuntime={cache:CacheInstance;waitUntil:(promise:Promise<unknown>)=>void};
export const searchCacheContext=createContext<SearchCacheRuntime|null>(null);
