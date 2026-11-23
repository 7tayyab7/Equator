/** Shopify handles accepted by product, collection and page lookups (lowercase letters, digits, hyphens). */
export const HANDLE_PATTERN=/^[a-z0-9-]{1,255}$/;
export function isValidHandle(handle:string){return HANDLE_PATTERN.test(handle);}
