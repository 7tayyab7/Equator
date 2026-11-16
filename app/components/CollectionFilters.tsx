import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {collectionSortOptions,priceBounds,type CollectionFilter,type CollectionState} from '../lib/collection-state';

function FilterGroup({title,children}:{title:string;children:ReactNode}) {
 const [expanded,setExpanded]=useState(false);const id=useId();
 return <section className={`collection-facet ${expanded?'is-expanded':''}`}>
  <h3><button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(!expanded)}>{title}<span aria-hidden="true">{expanded?'−':'+'}</span></button></h3>
  <div className="collection-facet-panel" id={id}><div>{children}</div></div>
 </section>;
}
export function CollectionFilters({open,onClose,filters,state,currency,onApply,initialTab='filter',hideBestSelling=false,defaultSort='featured',loading=false,error='',onRetry}:{loading?:boolean;error?:string;onRetry?:()=>void;defaultSort?:string;initialTab?:'filter'|'sort';hideBestSelling?:boolean;open:boolean;onClose:()=>void;filters:CollectionFilter[];state:CollectionState;currency:string;onApply:(state:CollectionState)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [visible,setVisible]=useState(false),[tab,setTab]=useState<'filter'|'sort'>('filter');
 const [draft,setDraft]=useState(state);
 const filterTab=useRef<HTMLButtonElement>(null),sortTab=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open)setDraft({...state,selected:[...state.selected]});},[state]);
 useEffect(()=>{
  if(!open)return;
  setDraft({...state,selected:[...state.selected]});setTab(initialTab);
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;
  dialog.current?.showModal();document.body.style.overflow='hidden';
  const frame=requestAnimationFrame(()=>setVisible(true));
  return()=>{cancelAnimationFrame(frame);if(closeTimer.current)clearTimeout(closeTimer.current);dialog.current?.close();document.body.style.overflow=overflow;previous?.focus();};
 },[open,initialTab]);
 function close() {setVisible(false);closeTimer.current=setTimeout(onClose,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:300);}
 const bounds=priceBounds(filters);
 const invalid=(draft.min!==''&&(!Number.isFinite(Number(draft.min))||Number(draft.min)<0))||(draft.max!==''&&(!Number.isFinite(Number(draft.max))||Number(draft.max)<0))||(draft.min!==''&&draft.max!==''&&Number(draft.min)>Number(draft.max));
 function select(id:string){setDraft(d=>({...d,selected:d.selected.includes(id)?d.selected.filter(v=>v!==id):[...d.selected,id]}));}
 function switchTab(value:'filter'|'sort'){setTab(value);}
 return <dialog ref={dialog} className="collection-filter-dialog" aria-labelledby="collection-filter-heading" data-open={visible} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)close();}}}>
  <h2 className="sr-only" id="collection-filter-heading">Filter & Sort</h2>
  <div className="collection-drawer-heading">
   <div role="tablist" aria-label="Filter and sort options" onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'filter':event.key==='End'?'sort':tab==='filter'?'sort':'filter';setTab(next);(next==='filter'?filterTab:sortTab).current?.focus();}}}>
    <button ref={filterTab} role="tab" id="collection-filter-tab" aria-controls="collection-filter-panel" aria-selected={tab==='filter'} tabIndex={tab==='filter'?0:-1} onClick={()=>switchTab('filter')}>Filter</button><span aria-hidden="true">|</span>
    <button ref={sortTab} role="tab" id="collection-sort-tab" aria-controls="collection-sort-panel" aria-selected={tab==='sort'} tabIndex={tab==='sort'?0:-1} onClick={()=>switchTab('sort')}>Sort</button>
   </div>
   <button className="collection-drawer-close" aria-label="Close filters" onClick={close}>×</button>
  </div>
  <div className="collection-drawer-scroll">
   <div role="tabpanel" id="collection-filter-panel" aria-labelledby="collection-filter-tab" hidden={tab!=='filter'} className="collection-tab-content">
    {loading?<p role="status">Loading filters…</p>:error?<p role="alert">{error} <button onClick={onRetry}>Try again</button></p>:filters.length===0&&<p className="collection-filter-note">No filters are available for this collection.</p>}
    {filters.map(filter=><FilterGroup key={filter.id} title={filter.label}>
     {filter.type==='PRICE_RANGE'&&bounds?<div className="collection-price">
      <p>Prices in {currency}</p>
      <div className="collection-price-inputs"><label>Minimum<input type="number" inputMode="decimal" min={bounds.min} max={bounds.max} step="any" placeholder={String(bounds.min)} value={draft.min} onChange={e=>setDraft({...draft,min:e.target.value})}/></label><span aria-hidden="true">—</span><label>Maximum<input type="number" inputMode="decimal" min={bounds.min} max={bounds.max} step="any" placeholder={String(bounds.max)} value={draft.max} onChange={e=>setDraft({...draft,max:e.target.value})}/></label></div>
      <label className="collection-range-label">Minimum price<input aria-label="Minimum price range" type="range" min={bounds.min} max={bounds.max} step="1" value={draft.min||bounds.min} onChange={e=>setDraft({...draft,min:String(Math.min(Number(e.target.value),Number(draft.max||bounds.max)))})}/></label>
      <label className="collection-range-label">Maximum price<input aria-label="Maximum price range" type="range" min={bounds.min} max={bounds.max} step="1" value={draft.max||bounds.max} onChange={e=>setDraft({...draft,max:String(Math.max(Number(e.target.value),Number(draft.min||bounds.min)))})}/></label>
      {invalid&&<p role="alert">Enter a valid price range: minimum must not exceed maximum.</p>}
     </div>:<div className="collection-filter-values">{filter.values.map(value=><label key={value.id}><input type="checkbox" checked={draft.selected.includes(value.id)} disabled={value.count===0&&!draft.selected.includes(value.id)} onChange={()=>select(value.id)}/><span>{value.label}</span><small>{value.count}</small></label>)}</div>}
    </FilterGroup>)}
   </div>
   <div role="tabpanel" id="collection-sort-panel" aria-labelledby="collection-sort-tab" hidden={tab!=='sort'} className="collection-tab-content">
    <div className="collection-sort-values" role="group" aria-label="Sort products">{collectionSortOptions(defaultSort,draft.sort).filter(sort=>!hideBestSelling||sort.value!=='best-selling').map(sort=><label key={sort.value}><input type="radio" name="collection-sort" checked={draft.sort===sort.value} onChange={()=>setDraft({...draft,sort:sort.value})}/><span>{hideBestSelling&&sort.value==='featured'?'Relevance':sort.label}</span></label>)}</div>
   </div>
  </div>
  <div className="collection-drawer-actions"><button onClick={()=>setDraft({selected:[],min:'',max:'',sort:defaultSort})}>Clear</button><button disabled={invalid||(tab==='filter'&&(loading||!!error))} onClick={()=>{onApply(draft);close();}}>Apply</button></div>
 </dialog>;
}
