import {CardPrice} from './CardPrice';
import {WishlistEmblem} from './WishlistEmblem';
import {CardGallery} from './CardGallery';
import {useWishlist} from './WishlistProvider';
import {Link} from 'react-router';
import {useState} from 'react';
import {QuickAdd} from './QuickAdd';
import {warmQuickAdd} from '../lib/quick-add.client';
import {responsiveImage,CARD_IMAGE_WIDTHS} from '../lib/images';
import type {ProductCardData} from '../lib/products.server';

/** Shared by homepage, collections, search and every recommendation rail. */
export function ProductCard({product,collection=false,priority=false,eager=false}:{product:ProductCardData;collection?:boolean;priority?:boolean;eager?:boolean}) {
 const wishlist=useWishlist(),saved=wishlist.items.some(item=>item.id===product.id);
 const [quickOpen,setQuickOpen]=useState(false);
 return <article className="product-card" onPointerEnter={event=>{if(event.pointerType!=='touch')warmQuickAdd(product.handle);}} onFocusCapture={()=>warmQuickAdd(product.handle)}>
  <div className="product-card-visual">
  <button className="product-card-save" type="button" disabled={!wishlist.ready} aria-label={`${saved?'Remove':'Save'} ${product.title}${saved?' from':' to'} wishlist`} aria-pressed={saved} onClick={()=>wishlist.toggle(product)}><WishlistEmblem filled={saved} className="product-card-wishlist-icon"/></button>
  {product.images.length>1?<CardGallery product={product} priority={priority} eager={eager}/>:(<Link className="product-card-main" to={`/products/${product.handle}`}>
   <div className="product-card-media">
    {product.images.length?product.images.slice(0,1).map((image,index)=><img key={image.url} className={index===0?'product-image-primary':'product-image-secondary'} {...responsiveImage(image.url,800,CARD_IMAGE_WIDTHS,collection?'(max-width:600px) calc((100vw - 50px)/2), (max-width:1100px) calc((100vw - 128px)/3), calc((100vw - 152px)/4)':'(max-width:600px) calc((100vw - 50px)/2), (max-width:1000px) 33vw, 25vw',image.width)} alt={index===0?image.alt:''} aria-hidden={index===1||undefined} width={image.width} height={image.height} loading={index===0&&!priority&&!eager?'lazy':'eager'} fetchPriority={index===0&&priority?'high':'auto'} decoding="async"/>):<span className="product-image-unavailable">Image unavailable</span>}
    {product.available===false&&<span className="product-sold-out">Sold out</span>}
   </div>
  </Link>)}
  <button className="product-card-quick-trigger" type="button" aria-label={`Quick add ${product.title}`} aria-haspopup="dialog" onPointerDown={()=>warmQuickAdd(product.handle)} onClick={()=>setQuickOpen(true)}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.3"/></svg></button>
  </div>
  <Link className="product-card-main" to={`/products/${product.handle}`}>
   <div className="product-card-copy">
    <h3>{product.title}</h3>
    <CardPrice product={product}/>
   </div>
  </Link>
  {quickOpen&&<QuickAdd handle={product.handle} title={product.title} onClose={()=>setQuickOpen(false)}/>}
 </article>;
}
