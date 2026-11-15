import {requestStorefront} from './storefront.server';
import {applyStorefrontMainMenu,applySeasonalMenus,type BackendMenu} from './backend-menus';
import {settings,type MenuGroup} from '../settings';
const query=`query RedesignNavigation {main:menu(handle:"equator-storefront-main-menu"){handle title items{id title url items{id title url}}} winter:menu(handle:"winter-2026"){handle title items{title url}} casual:menu(handle:"casual"){handle title items{title url}} formals:menu(handle:"formals"){handle title items{title url}} summerSale:menu(handle:"summer-new"){handle title items{title url}} winterSale:menu(handle:"winter-sale-2020"){handle title items{title url}}}`;
type StoreNavigation={menu:MenuGroup[];collectionGroups:MenuGroup[]};
const cache=new Map<string,{expires:number;value:StoreNavigation}>();
const pending=new Map<string,Promise<StoreNavigation>>();
export async function getStoreNavigation(env:Record<string,string>):Promise<StoreNavigation>{
 const key=env.PUBLIC_STORE_DOMAIN||'',hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;
 const running=pending.get(key);if(running)return running;
 const load=(async()=>{try{
  const data=await requestStorefront<Record<string,BackendMenu|null>>(env,query,{},AbortSignal.timeout(2500));
  const value={menu:applyStorefrontMainMenu(settings.menu,data),collectionGroups:applySeasonalMenus(settings.collectionGroups,data)};cache.set(key,{expires:Date.now()+60000,value});return value;
 }catch{return hit?.value||{menu:settings.menu,collectionGroups:settings.collectionGroups};}finally{pending.delete(key);}})();pending.set(key,load);return load;
}
