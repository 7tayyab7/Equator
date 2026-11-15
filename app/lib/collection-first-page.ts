/** Only plain first-page browsing can skip the complete variant availability index. */
export function fastCollectionFirstPage(params:URLSearchParams,handle:string){
 return handle!=='all'&&(!params.has('page')||params.get('page')==='1')&&(!params.has('sort')||params.get('sort')==='collection-default')&&!['filter','min','max','after','before'].some(key=>params.has(key));
}
export function collectionPageSort(sort:string){
 const values:Record<string,{key:string;reverse:boolean}>={featured:{key:'MANUAL',reverse:false},'best-selling':{key:'BEST_SELLING',reverse:false},'price-ascending':{key:'PRICE',reverse:false},'price-descending':{key:'PRICE',reverse:true},'title-ascending':{key:'TITLE',reverse:false},'title-descending':{key:'TITLE',reverse:true},'created-ascending':{key:'CREATED',reverse:false},'created-descending':{key:'CREATED',reverse:true}};
 return values[sort]||{key:'COLLECTION_DEFAULT',reverse:false};
}
