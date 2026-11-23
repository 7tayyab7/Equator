import {SelectorChevron} from './ProductOptionSelect';
import {useEffect,useId,useRef,useState} from 'react';
import {Link} from 'react-router';
import {shopifyImageURL as responsiveImage} from '../lib/images';

type Color={handle:string;title:string;image?:string};
export function ProductColors({colors,handle}:{colors:Color[];handle:string}){
 const [open,setOpen]=useState(false),[visible,setVisible]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),id=useId();
 const current=colors.find(color=>color.handle===handle)||colors[0];
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement|null;
  dialog.current?.showModal();
  const frame=requestAnimationFrame(()=>setVisible(true));
  return()=>{cancelAnimationFrame(frame);dialog.current?.close();if(previous?.isConnected)previous.focus();};
 },[open]);
 function close(){setVisible(false);dialog.current?.close();setOpen(false);}
 return <div className="pdp-color-section">
  <button type="button" className="pdp-color-trigger pdp-selector-control" aria-label={`Color: ${current?.title||'Select color'}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(true)}><span>{current?.title||'Select color'}</span><SelectorChevron/></button>
  <button type="button" className="pdp-more-colors" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(true)}>More colors</button>
  <dialog ref={dialog} id={id} className="pdp-color-dialog" data-open={visible} onClose={()=>setOpen(false)} aria-labelledby={`${id}-heading`} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}}}>
   <div className="pdp-color-dialog-heading"><h2 id={`${id}-heading`}>Select color</h2><button type="button" aria-label="Close colors" onClick={close}>×</button></div>
   <nav className="pdp-color-grid" aria-label="Product colors">{colors.map(color=><Link key={color.handle} to={`/products/${color.handle}`} aria-label={color.title} aria-current={color.handle===handle?'page':undefined} onClick={event=>{if(color.handle===handle){event.preventDefault();close();}}}><span className="pdp-color-image">{color.image?<img src={responsiveImage(color.image,500)} srcSet={[200,350,500].map(w=>`${responsiveImage(color.image!,w)} ${w}w`).join(', ')} sizes="(max-width:850px) 38vw, 16vw" alt={color.title} width="300" height="400" loading="lazy" decoding="async"/>:<span>Image unavailable</span>}</span><span className="pdp-color-name">{color.title}</span></Link>)}</nav>
  </dialog>
 </div>;
}
