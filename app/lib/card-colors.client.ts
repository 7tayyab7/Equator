import {colorProductHandles} from './product-helpers';
import type {CardColor} from './card-colors.server';
// Share and batch discovery across cards/rails. Never hold up the product loader or primary image.
const cache=new Map<string,{expires:number;promise:Promise<CardColor[]>}>();
const pending:{handle:string;resolve:(colors:CardColor[])=>void;reject:(error:unknown)=>void}[]=[];
let scheduled=false,active=0;
function flush(){
 scheduled=false;
 while(active<2&&pending.length){
  const batch=pending.splice(0,4);active++;
  fetch(`/resources/card-colors?handles=${batch.map(item=>item.handle).join(',')}`)
   .then(async response=>{if(!response.ok)throw new Error('Color discovery unavailable');return await response.json() as Record<string,CardColor[]>;})
   .then(data=>batch.forEach(item=>item.resolve(data[item.handle]||[])))
   .catch(error=>batch.forEach(item=>{cache.delete(colorProductHandles(item.handle)[0]);item.reject(error);}))
   .finally(()=>{active--;flush();});
 }
}
export function loadCardColors(handle:string):Promise<CardColor[]> {
 const key=colorProductHandles(handle)[0],hit=cache.get(key);
 if(hit&&hit.expires>Date.now())return hit.promise;
 const promise=new Promise<CardColor[]>((resolve,reject)=>pending.push({handle,resolve,reject}));
 if(cache.size>=300)cache.delete(cache.keys().next().value!);
 cache.set(key,{expires:Date.now()+300_000,promise});
 if(!scheduled){scheduled=true;setTimeout(flush,40);}
 return promise;
}
