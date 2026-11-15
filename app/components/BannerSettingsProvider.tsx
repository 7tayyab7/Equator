import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {defaultBanners, type BannerSettings} from '../content/banners';
const storageKey = 'equator-preview-banners-cdn-v6';
const previousStorageKey = 'equator-preview-banners-v2';
const legacyStorageKey = 'equator-preview-banners-v1';
const BannerContext = createContext<{banners: BannerSettings[]; update: (id:string, patch:Partial<BannerSettings>)=>void; reset:()=>void}>({banners:defaultBanners,update:()=>{},reset:()=>{}});
export function BannerSettingsProvider({children,initialBanners=defaultBanners}: {children:ReactNode;initialBanners?:BannerSettings[]}) {
  const [banners,setBanners] = useState(initialBanners);
  useEffect(()=>{
    try {
      let saved = JSON.parse(localStorage.getItem(storageKey)||'null');
      if (Array.isArray(saved)) setBanners(initialBanners.map(banner=>({...banner,...saved.find(item=>item?.id===banner.id)})));
    } catch { /* Invalid preview storage falls back to server defaults. */ }
  },[]);
  function update(id:string,patch:Partial<BannerSettings>) {
    setBanners(current=>{
      const next=current.map(banner=>banner.id===id?{...banner,...patch}:banner);
      try {localStorage.setItem(storageKey,JSON.stringify(next));} catch { /* Preview still works without persistence. */ }
      return next;
    });
  }
  function reset() {setBanners(initialBanners);try {localStorage.removeItem(storageKey);localStorage.removeItem(previousStorageKey);localStorage.removeItem(legacyStorageKey);} catch {}}
  return <BannerContext.Provider value={{banners,update,reset}}>{children}</BannerContext.Provider>;
}
export function useBannerSettings() {return useContext(BannerContext);}
