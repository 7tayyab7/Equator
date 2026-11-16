import {parseBaadmayConfig,type BaadmayConfig} from './baadmay.ts';
export function createBaadmayConfigLoader(fetcher:typeof fetch=fetch){
 let cached:BaadmayConfig|null=null,expires=0;
 return async(signal?:AbortSignal)=>{
  if(Date.now()<expires)return cached;
  try{
   const response=await fetcher('https://cms.baadmay.com/Fees?merchant_name=equatorstores.myshopify.com',{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(3000)]):AbortSignal.timeout(3000),headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Baadmay fees unavailable');
   cached=parseBaadmayConfig(await response.json());expires=Date.now()+(cached?300000:15000);return cached;
  }catch{if(!signal?.aborted&&Date.now()>=expires){cached=null;expires=Date.now()+15000;}return null;}
 };
}
export const getBaadmayConfig=createBaadmayConfigLoader();
