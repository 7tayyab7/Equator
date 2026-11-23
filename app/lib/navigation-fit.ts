/** Fit earlier links around the pinned final category and More. */
export function fitMenuIndices(widths:readonly number[],more:number,available:number,gap:number,pinned:number,limit=widths.length):number[]{
 const count=Math.min(limit,widths.length),keep=pinned>=0&&pinned<count;
 let used=more+(keep?widths[pinned]+gap:0);
 const result:number[]=keep&&used<=available?[pinned]:[];
 if(used>available)return [];
 for(let index=0;index<count;index++){
  if(keep&&index===pinned)continue;
  if(used+widths[index]+gap>available)break;
  result.push(index);used+=widths[index]+gap;
 }
 return result.sort((a,b)=>a-b);
}
