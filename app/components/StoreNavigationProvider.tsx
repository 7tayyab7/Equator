import {createContext,useContext,type ReactNode} from 'react';
import {settings,type MenuGroup} from '../settings';
const StoreMenu=createContext<MenuGroup[]>(settings.menu);
const SeasonalMenu=createContext<MenuGroup[]>(settings.collectionGroups);
export function StoreNavigationProvider({menu,collectionGroups=settings.collectionGroups,children}:{menu:MenuGroup[];collectionGroups?:MenuGroup[];children:ReactNode}){return <StoreMenu.Provider value={menu}><SeasonalMenu.Provider value={collectionGroups}>{children}</SeasonalMenu.Provider></StoreMenu.Provider>;}
export function useStoreMenu(){return useContext(StoreMenu);}
export function useSeasonalMenu(){return useContext(SeasonalMenu);}
