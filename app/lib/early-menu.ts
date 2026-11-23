/**
 * The header menu must work in the first seconds of a visit, before the page's JavaScript has started (on a slow
 * phone that takes 3-5 s after the menu is already visible). Without this, taps on the menu in that window were lost.
 *  - Top-level collection items are plain links (see StoreLayout), so they work like any link.
 *  - Desktop dropdowns open on hover through earlyDropdownCSS until the page is ready (html[data-equator-ready]).
 *  - A tap on a menu button that opens a panel (mobile menu, "More") is remembered by EARLY_MENU_SCRIPT, placed in
 *    <head>, and the panel opens as soon as the page is ready (takeEarlyPanel).
 */
export const EARLY_MENU_SCRIPT="document.addEventListener('click',function(e){if(window.__equatorHydrated)return;var t=e.target,b=t&&t.closest?t.closest('[data-early-panel]'):null;if(!b)return;e.preventDefault();window.__equatorEarlyPanel=b.getAttribute('data-early-panel');document.documentElement.classList.add('equator-early-panel');},true);";

type EarlyWindow=Window&{__equatorEarlyPanel?:string};
/** Returns the panel tapped before the page was ready (once, then clears it). */
export function takeEarlyPanel():string|null{
 if(typeof window==='undefined')return null;const w=window as EarlyWindow;const panel=w.__equatorEarlyPanel||null;
 delete w.__equatorEarlyPanel;document.documentElement.classList.remove('equator-early-panel');return panel;
}

/** Hover-to-open rules for the desktop dropdowns that apply only until the page's JavaScript is ready.
 * Tailwind's base layer hides [hidden] with !important, and an !important rule inside a layer beats one outside any
 * layer, so these rules join that same base layer, where their higher specificity (an id) wins. */
export function earlyDropdownCSS(groups:{children:unknown[]}[]){
 const rules=groups.map((group,index)=>group.children.length?`html:not([data-equator-ready]) .store-header:has([aria-controls="menu-${index}"]:hover,#menu-${index}:hover) #menu-${index}{display:grid!important}`:'').filter(Boolean);
 return rules.length?`@layer base{@media (min-width:851px){${rules.join('')}}}`:'';
}
