export class JsonRequestTimeoutError extends Error {
  constructor(){super('This request took too long. Please try again.');this.name='JsonRequestTimeoutError';}
}

/** Bound both headers and JSON decoding. Never retry mutations automatically. */
export async function requestJSON<T>(url:string,options:RequestInit={},timeoutMs=25_000,send:typeof fetch=fetch):Promise<{response:Response;data:T}>{
  const controller=new AbortController(),source=options.signal;
  const abort=()=>controller.abort(source?.reason);
  if(source?.aborted)abort();else source?.addEventListener('abort',abort,{once:true});
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([
      (async()=>{const response=await send(url,{...options,signal:controller.signal});const data=await response.json() as T;if(source?.aborted)throw source.reason||new DOMException('Request cancelled','AbortError');return {response,data};})(),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(new JsonRequestTimeoutError());controller.abort();},timeoutMs);}),
    ]);
  }finally{if(timer!==undefined)clearTimeout(timer);source?.removeEventListener('abort',abort);}
}

export async function loadJSON<T>(url:string,options:RequestInit={},timeoutMs=15000):Promise<T>{const {response,data}=await requestJSON<T&{error?:string}>(url,options,timeoutMs);if(!response.ok)throw Error(data.error||'This request could not be completed. Please try again.');return data;}
