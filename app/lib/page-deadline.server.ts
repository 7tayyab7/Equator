export class PageDeadlineError extends Error {
  constructor(){super('Public page exceeded its request deadline');this.name='PageDeadlineError';}
}

// Public documents: never interrupt cart mutations, app proxies,
// privacy endpoints, accounts or checkout. Preserve the caller's cancellation.
export function isDeadlinePage(request:Request){
  const path=new URL(request.url).pathname.replace(/\.data$/,'');
  return request.method==='GET'&&(path==='/'||path==='/search'||/^\/(?:products|collections|pages|policies|blogs)(?:\/[a-z0-9-]+){0,2}\/?$/.test(path));
}
export async function withPageDeadline<T>(request:Request,load:(request:Request)=>Promise<T>,timeoutMs=12_000):Promise<T>{
  if(!isDeadlinePage(request))return load(request);
  const controller=new AbortController();
  const scoped=new Request(request,{signal:AbortSignal.any([request.signal,controller.signal])});
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([load(scoped),new Promise<never>((_,reject)=>{
      timer=setTimeout(()=>{reject(new PageDeadlineError());controller.abort();},timeoutMs);
    })]);
  }finally{if(timer!==undefined)clearTimeout(timer);}
}
