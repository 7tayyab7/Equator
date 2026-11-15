import {useEffect,useId,useRef,useState} from 'react';

export function CollectionDescription({description}:{description:string}) {
 const id=useId(),textRef=useRef<HTMLParagraphElement>(null);
 const [expanded,setExpanded]=useState(false),[overflows,setOverflows]=useState(false);
 useEffect(()=>{
  const text=textRef.current;if(!text)return;
  const measure=()=>setOverflows(text.scrollHeight>parseFloat(getComputedStyle(text).lineHeight)*2+1);
  measure();
  const observer=new ResizeObserver(measure);observer.observe(text);
  return ()=>observer.disconnect();
 },[description]);
 return <div className="collection-description">
  <p ref={textRef} id={id} className={expanded?'is-expanded':'is-collapsed'}>{description}</p>
  {overflows&&<button type="button" className="collection-description-toggle" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?'Read less':'Read more'}</button>}
 </div>;
}
