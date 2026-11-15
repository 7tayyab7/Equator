import {parseBaadmayConfig,type BaadmayConfig} from './baadmay';
export function createBaadmayConfigLoader(fetcher:typeof fetch=fetch){
 let cached:BaadmayConfig|null=null,expires=0,pending:Promise<BaadmayConfig|null>|null=null;
 return async()=>{
  if(Date.now()<expires)return cached;if(pending)return pending;
  pending=(async()=>{try{
   const response=await fetcher('https://cms.baadmay.com/Fees?merchant_name=equatorstores.myshopify.com',{signal:AbortSignal.timeout(3000),headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Baadmay fees unavailable');
   cached=parseBaadmayConfig(await response.json());expires=Date.now()+(cached?300000:15000);return cached;
  }catch{cached=null;expires=Date.now()+15000;return null;}finally{pending=null;}})();return pending;
 };
}
export const getBaadmayConfig=createBaadmayConfigLoader();
