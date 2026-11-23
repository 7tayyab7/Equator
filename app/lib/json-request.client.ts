export class JsonRequestTimeoutError extends Error {
  constructor(){super('This request took too long. Please try again.');this.name='JsonRequestTimeoutError';}
}

/** A dropped connection or an unreadable reply. Browsers word this as "Failed to fetch" (Chrome), "NetworkError when
 * attempting to fetch resource." (Firefox) or "Load failed" (Safari); shoppers see this message instead. */
export class JsonRequestNetworkError extends Error {
  constructor(){super('Connection problem. Please check your internet and try again.');this.name='JsonRequestNetworkError';}
}

/** Bound both headers and JSON decoding. Never retry mutations automatically. */
export async function requestJSON<T>(url:string,options:RequestInit={},timeoutMs=25_000,send:typeof fetch=fetch):Promise<{response:Response;data:T}>{
  const controller=new AbortController(),source=options.signal;
  const abort=()=>controller.abort(source?.reason);
  if(source?.aborted)abort();else source?.addEventListener('abort',abort,{once:true});
  let timer:ReturnType<typeof setTimeout>|undefined;
  // Cancellation keeps its own error so callers can still tell it apart; everything else becomes a readable message.
  const cancelled=()=>!!source?.aborted||controller.signal.aborted;
  try{
    return await Promise.race([
      (async()=>{
        let response:Response,data:T;
        try{response=await send(url,{...options,signal:controller.signal});}catch(cause){if(cancelled())throw cause;throw new JsonRequestNetworkError();}
        try{data=await response.json() as T;}catch(cause){if(cancelled())throw cause;throw new JsonRequestNetworkError();}
        if(source?.aborted)throw source.reason||new DOMException('Request cancelled','AbortError');return {response,data};
      })(),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(new JsonRequestTimeoutError());controller.abort();},timeoutMs);}),
    ]);
  }finally{if(timer!==undefined)clearTimeout(timer);source?.removeEventListener('abort',abort);}
}

export async function loadJSON<T>(url:string,options:RequestInit={},timeoutMs=15000):Promise<T>{const {response,data}=await requestJSON<T&{error?:string}>(url,options,timeoutMs);if(!response.ok)throw Error(data.error||'This request could not be completed. Please try again.');return data;}
