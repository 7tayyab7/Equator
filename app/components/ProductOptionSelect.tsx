import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';

export function SelectorChevron(){return <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="m1 1 5 5 5-5" stroke="currentColor" strokeWidth="1"/></svg>;}

/** A consistent, keyboard-accessible listbox; values still resolve real Shopify variants. */
export function ProductOptionSelect({name,value,options,disabled,onChange}:{name:string;value:string;options:{value:string;available:boolean}[];disabled:boolean;onChange:(value:string)=>void}){
 const id=useId(),button=useRef<HTMLButtonElement>(null),list=useRef<HTMLUListElement>(null),root=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[above,setAbove]=useState(false);
 const typeahead=useRef({text:'',time:0});
 function show(){if(disabled||!options.length)return;const rect=button.current!.getBoundingClientRect(),height=Math.min(options.length*44,260,innerHeight*.4);setAbove(innerHeight-rect.bottom<height&&rect.top>innerHeight-rect.bottom);setActive(Math.max(0,options.findIndex(option=>option.value===value)));setOpen(true);}
 function close(focus=false){setOpen(false);if(focus)button.current?.focus({preventScroll:true});}
 function select(index:number){onChange(options[index].value);close(true);}
 useEffect(()=>{if(!open)return;list.current?.focus({preventScroll:true});const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 useEffect(()=>{const node=list.current,option=document.getElementById(`${id}-${active}`);if(open&&node&&option){const item=option.getBoundingClientRect(),box=node.getBoundingClientRect();if(item.top<box.top)node.scrollTop-=box.top-item.top;else if(item.bottom>box.bottom)node.scrollTop+=item.bottom-box.bottom;}},[active,id,open]);
 function keys(event:KeyboardEvent){
  if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key))event.preventDefault();
  if(event.key==='ArrowDown')setActive(index=>(index+1)%options.length);
  else if(event.key==='ArrowUp')setActive(index=>(index+options.length-1)%options.length);
  else if(event.key==='Home')setActive(0);
  else if(event.key==='End')setActive(options.length-1);
  else if(event.key==='Enter'||event.key===' ')select(active);
  else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
  else if(event.key==='Tab')close();
  else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){const now=Date.now();typeahead.current={text:(now-typeahead.current.time<500?typeahead.current.text:'')+event.key.toLowerCase(),time:now};const index=options.findIndex(option=>option.value.toLowerCase().startsWith(typeahead.current.text));if(index>=0)setActive(index);}
 }
 return <div className="pdp-option-select" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setOpen(false);}}>
  <button ref={button} type="button" className="pdp-selector-control" disabled={disabled} aria-label={`Select ${name}: ${value||'Not selected'}`} aria-haspopup="listbox" aria-controls={id} aria-expanded={open} onClick={()=>open?close():show()} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();show();}}}><span>{value||`Select ${name}`}</span><SelectorChevron/></button>
  {open&&<ul ref={list} id={id} role="listbox" aria-label={name} aria-activedescendant={`${id}-${active}`} tabIndex={-1} className="pdp-option-list" data-above={above} onKeyDown={keys}>{options.map((option,index)=><li key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value===value} data-active={index===active} onPointerDown={event=>event.preventDefault()} onPointerMove={()=>setActive(index)} onClick={()=>select(index)}>{option.value}{!option.available&&<span>Sold out</span>}</li>)}</ul>}
 </div>;
}
