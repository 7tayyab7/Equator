import {ArrowIcon} from './ArrowIcon';
import {useRef,useState,type PointerEvent} from 'react';
import {Link} from 'react-router';
import {responsiveImage,CARD_IMAGE_WIDTHS} from '../lib/images';
import type {ProductCardData} from '../lib/products.server';

/** Native touch scrolling plus mouse dragging; a deliberate click remains a product link. */
export function CardGallery({product,priority=false,eager=false}:{product:ProductCardData;priority?:boolean;eager?:boolean}){
 const track=useRef<HTMLDivElement>(null),drag=useRef<{id:number;type:string;x:number;y:number;left:number;moved:boolean}|null>(null),suppressClickUntil=useRef(0);
 const [active,setActive]=useState(0),[used,setUsed]=useState(false);
 const images=product.images;
 function move(index:number){const node=track.current;if(!node)return;setUsed(true);const next=Math.max(0,Math.min(images.length-1,index));setActive(next);node.scrollTo({left:next*node.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
 function down(event:PointerEvent<HTMLDivElement>){if(event.pointerType==='mouse'&&event.button!==0)return;setUsed(true);drag.current={id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,moved:false};}
 function pointerMove(event:PointerEvent<HTMLDivElement>){const d=drag.current;if(!d||d.id!==event.pointerId)return;if(d.type==='mouse'&&!(event.buttons&1)){drag.current=null;event.currentTarget.style.scrollSnapType='';return;}const dx=event.clientX-d.x,dy=event.clientY-d.y;if(Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){d.moved=true;suppressClickUntil.current=performance.now()+500;}
  if(d.type==='mouse'&&d.moved&&(event.buttons&1)){event.preventDefault();event.currentTarget.style.scrollSnapType='none';if(!event.currentTarget.hasPointerCapture(d.id))event.currentTarget.setPointerCapture(d.id);event.currentTarget.scrollLeft=d.left-dx;}
 }
 function up(event:PointerEvent<HTMLDivElement>){const d=drag.current;if(!d||d.id!==event.pointerId)return;drag.current=null;if(d.moved)suppressClickUntil.current=performance.now()+500;event.currentTarget.style.scrollSnapType='';if(event.currentTarget.hasPointerCapture(d.id))event.currentTarget.releasePointerCapture(d.id);if(d.type==='mouse'&&d.moved)move(Math.round(event.currentTarget.scrollLeft/event.currentTarget.clientWidth));}
 return <div className="product-card-gallery">
  <Link className="product-card-main" to={`/products/${product.handle}`} aria-label={`View ${product.title}`} draggable={false} onDragStart={e=>e.preventDefault()} onClick={event=>{if(performance.now()<suppressClickUntil.current){event.preventDefault();event.stopPropagation();}}} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(active+(event.key==='ArrowLeft'?-1:1));}}}>
   <div className="product-card-media"><div className="product-card-gallery-track" ref={track} onPointerDown={down} onPointerMove={pointerMove} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={event=>{if(drag.current?.id===event.pointerId){drag.current=null;event.currentTarget.style.scrollSnapType='';}}} onScroll={event=>{const n=event.currentTarget;setActive(Math.max(0,Math.min(images.length-1,Math.round(n.scrollLeft/n.clientWidth))));}}>
    {images.map((image,index)=><div className="product-card-gallery-slide" key={`${image.url}-${index}`} aria-hidden={index!==active}>{(index===0||used&&Math.abs(index-active)<=1)&&<img className="product-gallery-image" {...responsiveImage(image.url,800,CARD_IMAGE_WIDTHS,'(max-width:600px) calc((100vw - 50px)/2), (max-width:1100px) calc((100vw - 128px)/3), calc((100vw - 152px)/4)',image.width)} alt={index===active?image.alt:''} width={image.width} height={image.height} loading={index===0&&!priority&&!eager?'lazy':'eager'} fetchPriority={index===0&&priority?'high':'auto'} decoding="async" draggable={false}/>}</div>)}
   </div>{product.available===false&&<span className="product-sold-out">Sold out</span>}</div>
  </Link>
  <button className="card-gallery-arrow is-previous" type="button" aria-label={`Previous photo of ${product.title}`} disabled={active===0} onClick={()=>move(active-1)}><ArrowIcon direction="left" chevron/></button>
  <button className="card-gallery-arrow is-next" type="button" aria-label={`Next photo of ${product.title}`} disabled={active===images.length-1} onClick={()=>move(active+1)}><ArrowIcon chevron/></button>
  <span className="sr-only" role="status">Photo {active+1} of {images.length}</span>
 </div>;
}
