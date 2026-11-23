import {loadJSON} from '../lib/json-request.client';
import {ArrowIcon} from './ArrowIcon';
import {useEffect,useState} from 'react';
import {Link} from 'react-router';
import {useWishlist} from './WishlistProvider';
import {ProductCard} from './ProductCard';
import type {ProductCardData} from '../lib/products.server';
export function WishlistContents(){
 const {items,ready}=useWishlist(),[products,setProducts]=useState<ProductCardData[]>([]),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
 const ids=items.map(p=>p.id).join(',');
 useEffect(()=>{if(!ids){setProducts([]);setLoading(false);setFailed(false);return;}const controller=new AbortController();setLoading(true);setFailed(false);loadJSON<{products:ProductCardData[]}>(`/resources/wishlist-products?ids=${encodeURIComponent(ids)}`,{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setProducts(data.products);}).catch(()=>{if(!controller.signal.aborted)setFailed(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[ids]);
 if(!ready||loading)return <p role="status">Loading saved items…</p>;
 return <><p className="wishlist-note">Saved on this device. {items.length}/40 items.</p>{failed?<p role="status">Current product details could not be loaded. Please try again later.</p>:products.length?<div className="wishlist-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<p>Your wishlist is empty.</p>}<Link className="wishlist-continue" to="/collections/new-arrivals">Explore new arrivals <ArrowIcon/></Link></>;
}
