import {createContext,useContext,type ReactNode} from 'react';
import type {BannerSettings} from '../content/banners';
const BannerContext=createContext<{banners:BannerSettings[]}>({banners:[]});
export function BannerSettingsProvider({children,initialBanners=[]}:{children:ReactNode;initialBanners?:BannerSettings[]}){return <BannerContext value={{banners:initialBanners}}>{children}</BannerContext>;}
export function useBannerSettings(){return useContext(BannerContext);}
