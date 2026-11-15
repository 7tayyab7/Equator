export function blogPagination(params:URLSearchParams,cursors:string[],pageSize=9){
 const pageCount=Math.max(1,Math.ceil(cursors.length/pageSize)),raw=params.get('page');let requested=raw&&/^\d{1,7}$/.test(raw)?Number(raw):1;
 if(!raw){const after=cursors.indexOf(params.get('after')||''),before=cursors.indexOf(params.get('before')||'');if(after>=0)requested=Math.floor((after+1)/pageSize)+1;else if(before>=0)requested=Math.max(1,Math.ceil(before/pageSize));}
 const page=Math.max(1,Math.min(pageCount,requested)),offset=(page-1)*pageSize;return {page,pageCount,offset,after:offset?cursors[offset-1]:null};
}
