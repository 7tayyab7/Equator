import assert from 'node:assert/strict';import {test} from 'node:test';
import {parseCollectionState,collectionSearch,storefrontFilters,collectionSorts} from '../app/lib/collection-state.ts';
const filters=[{id:'size',label:'Size',type:'LIST',values:[{id:'s',input:'{"variantOption":{"name":"Size","value":"S"}}'},{id:'m',input:'{"variantOption":{"name":"Size","value":"M"}}'}]},{id:'price',label:'Price',type:'PRICE_RANGE',values:[{input:'{"price":{"min":0,"max":5000}}'}]}];
test('only backend filter ids survive, repeated values deduplicate',()=>{assert.deepEqual(parseCollectionState(new URLSearchParams('filter=s&filter=m&filter=s&filter=fake'),filters).selected,['m','s']);});
test('price normalization rejects NaN, clamps bounds, handles zero and swaps invalid ranges',()=>{assert.deepEqual(parseCollectionState(new URLSearchParams('min=Infinity&max=NaN'),filters),{selected:[],min:'',max:'',sort:'collection-default'});assert.deepEqual(parseCollectionState(new URLSearchParams('min=9000&max=-1'),filters),{selected:[],min:'0',max:'5000',sort:'collection-default'});});
test('URL serialization retains selections/sort but resets pagination',()=>{const state={selected:['s','m'],min:'0',max:'2000',sort:'price-descending'};const p=collectionSearch(state);assert.equal(p.has('after'),false);assert.deepEqual(parseCollectionState(p,filters),{...state,selected:['m','s']});});
test('API filters use actual Shopify input and support multi-select plus price',()=>{assert.deepEqual(storefrontFilters({selected:['s','m'],min:'0',max:'1000',sort:'collection-default'},filters),[{variantOption:{name:'Size',value:'S'}},{variantOption:{name:'Size',value:'M'}},{price:{min:0,max:1000}}]);});
test('unconfigured price/filter choices cannot be invented and unknown sorting falls back',()=>{const state=parseCollectionState(new URLSearchParams('filter=s&min=1&max=2&sort=made-up'),[]);assert.deepEqual(state,{selected:[],min:'',max:'',sort:'collection-default'});assert.equal(collectionSorts.length,8);});

test('collections use their backend default, explicit sorts round-trip, and search retains relevance',()=>{
 assert.equal(parseCollectionState(new URLSearchParams(),filters).sort,'collection-default');
 for(const sort of collectionSorts){const state={selected:[],min:'',max:'',sort:sort.value};assert.equal(parseCollectionState(collectionSearch(state),filters).sort,sort.value);}
 assert.equal(parseCollectionState(new URLSearchParams(),filters,'featured').sort,'featured');
 assert.equal(collectionSearch({selected:[],min:'',max:'',sort:'featured'},'featured').has('sort'),false);
});

test('all backend default choices survive filters, reset URLs and shopper overrides',()=>{
 for(const setting of collectionSorts){
  const state=parseCollectionState(new URLSearchParams('filter=s'),filters,setting.value);
  assert.equal(state.sort,setting.value);assert.equal(collectionSearch(state,setting.value).has('sort'),false);
  assert.equal(parseCollectionState(collectionSearch(state,setting.value),filters,setting.value).sort,setting.value);
  for(const override of collectionSorts){const selected={...state,sort:override.value};assert.equal(parseCollectionState(collectionSearch(selected,setting.value),filters,setting.value).sort,override.value);}
 }
});
