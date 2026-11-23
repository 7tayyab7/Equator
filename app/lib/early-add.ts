/**
 * A tap on "Add to bag" before the page's JavaScript has started is remembered instead of lost: the inline script
 * (EARLY_ADD_SCRIPT, in <head>) records which product was tapped, and the product page runs the normal add as soon
 * as it is ready. The button's markup is not touched before hydration (only a class on <html>), so React hydrates it
 * cleanly; the add itself is the usual one (same cart request, same pixels).
 */
export const EARLY_ADD_SCRIPT="document.addEventListener('click',function(e){if(window.__equatorHydrated)return;var t=e.target,b=t&&t.closest?t.closest('[data-add-to-bag]'):null;if(!b||b.disabled)return;e.preventDefault();window.__equatorEarlyAdd=b.getAttribute('data-add-to-bag');document.documentElement.classList.add('equator-early-add');},true);";
type EarlyWindow=Window&{__equatorHydrated?:boolean;__equatorEarlyAdd?:string};
export function markHydrated(){if(typeof window!=='undefined')(window as EarlyWindow).__equatorHydrated=true;}
/** Returns true once (and clears it) when the shopper tapped this product's Add to bag before the page was ready. */
export function takeEarlyAdd(productId:string){
 if(typeof window==='undefined')return false;const w=window as EarlyWindow;
 const hit=w.__equatorEarlyAdd===productId;if(w.__equatorEarlyAdd)delete w.__equatorEarlyAdd;
 document.documentElement.classList.remove('equator-early-add');return hit;
}
