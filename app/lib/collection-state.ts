export type CollectionFilterValue={id:string;label:string;count:number;input:string};
export type CollectionFilter={id:string;label:string;type:'LIST'|'BOOLEAN'|'PRICE_RANGE';values:CollectionFilterValue[]};
export const collectionSorts=[
 {value:'featured',label:'Featured',key:'MANUAL',reverse:false},
 {value:'best-selling',label:'Best Selling',key:'BEST_SELLING',reverse:false},
 {value:'price-ascending',label:'Price Low–High',key:'PRICE',reverse:false},
 {value:'price-descending',label:'Price High–Low',key:'PRICE',reverse:true},
 {value:'title-ascending',label:'A–Z',key:'TITLE',reverse:false},
 {value:'title-descending',label:'Z–A',key:'TITLE',reverse:true},
 {value:'created-descending',label:'Newest',key:'CREATED',reverse:true},
 {value:'created-ascending',label:'Oldest',key:'CREATED',reverse:false},
] as const;
export function collectionSortOptions(defaultSort:string,currentSort=defaultSort){return currentSort==='collection-default'||defaultSort==='collection-default'?[{value:'collection-default',label:'Default'},...collectionSorts]:collectionSorts;}
export type CollectionState={selected:string[];min:string;max:string;sort:string};
export function priceBounds(filters:CollectionFilter[]) {
 const filter=filters.find(f=>f.type==='PRICE_RANGE');
 if(!filter?.values[0])return null;
 try {const value=JSON.parse(filter.values[0].input).price;return {min:Number(value.min)||0,max:Number(value.max)||0};}catch{return null;}
}
export function parseCollectionState(params:URLSearchParams,filters:CollectionFilter[],defaultSort="collection-default"):CollectionState {
 const ids=new Set(filters.filter(f=>f.type!=='PRICE_RANGE').flatMap(f=>f.values.map(v=>v.id)));
 const selected=[...new Set(params.getAll('filter').filter(id=>ids.has(id)))].sort();
 const bounds=priceBounds(filters);
 const price=(key:string)=>{const raw=params.get(key);if(!bounds||!raw?.trim()||!Number.isFinite(Number(raw)))return '';return String(Math.max(bounds.min,Math.min(bounds.max,Number(raw))));};
 let min=price('min'),max=price('max');
 if(min!==''&&max!==''&&Number(min)>Number(max))[min,max]=[max,min];
 const sort=params.get('sort')==='collection-default'?'collection-default':collectionSorts.find(s=>s.value===params.get('sort'))?.value||defaultSort;
 return {selected,min,max,sort};
}
export function collectionSearch(state:CollectionState,defaultSort="collection-default") {
 const params=new URLSearchParams();
 for(const id of [...new Set(state.selected)].sort())params.append('filter',id);
 if(state.min!=='')params.set('min',state.min);
 if(state.max!=='')params.set('max',state.max);
 if(state.sort!==defaultSort)params.set('sort',state.sort);
 return params;
}
export function storefrontFilters(state:CollectionState,filters:CollectionFilter[]) {
 const selected=new Set(state.selected);
 const inputs=filters.filter(f=>f.type!=='PRICE_RANGE').flatMap(f=>f.values.filter(v=>selected.has(v.id)).map(v=>JSON.parse(v.input) as Record<string,unknown>));
 if(priceBounds(filters)&&(state.min!==''||state.max!==''))inputs.push({price:{...(state.min!==''?{min:Number(state.min)}:{}),...(state.max!==''?{max:Number(state.max)}:{})}});
 return inputs;
}
