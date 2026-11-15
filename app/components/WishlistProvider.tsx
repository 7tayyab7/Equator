import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {ProductCardData} from '../lib/products.server';
type Wishlist={items:ProductCardData[];ready:boolean;toggle:(product:ProductCardData)=>void;remove:(id:string)=>void};
const Context=createContext<Wishlist|null>(null);
export function WishlistProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<ProductCardData[]>([]),[ready,setReady]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('equator-wishlist')||'[]');if(Array.isArray(saved))setItems(saved.filter(p=>p&&typeof p.id==='string'&&/^gid:\/\/shopify\/Product\/\d+$/.test(p.id)&&typeof p.handle==='string'&&/^[a-z0-9-]{1,255}$/.test(p.handle)&&typeof p.title==='string'&&Number.isFinite(p.price)&&/^[A-Z]{3}$/.test(p.currency)&&Array.isArray(p.images)).map(p=>({...p,images:p.images.filter((i:{url?:unknown})=>typeof i?.url==='string'&&i.url.startsWith('https://cdn.shopify.com/')).slice(0,2)})).slice(0,40));}catch{/* Storage is optional. */}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('equator-wishlist',JSON.stringify(items));}catch{/* Private browsing or storage limits must not block shopping. */}},[items,ready]);
 function toggle(product:ProductCardData){setItems(current=>current.some(p=>p.id===product.id)?current.filter(p=>p.id!==product.id):[product,...current].slice(0,40));}
 return <Context.Provider value={{items,ready,toggle,remove:id=>setItems(current=>current.filter(p=>p.id!==id))}}>{children}</Context.Provider>;
}
export function useWishlist(){const value=useContext(Context);if(!value)throw new Error('WishlistProvider missing');return value;}
