/**
 * First paint without waiting for a separate stylesheet download.
 *
 * The site stylesheet is placed in the document head as a <style> element, and the original
 * <link> is kept but switched to non-blocking (media="print" → "all" once loaded), so the app
 * and client-side navigation behave exactly as before. Any failure returns the page unchanged.
 */
const ROOT_CSS=/<link rel="stylesheet" href="([^"]*\/assets\/root-[A-Za-z0-9_-]+\.css)"\/?>/;
const MAX_CSS_BYTES=400_000,MAX_HEAD_BYTES=256_000;
const stylesheets=new Map<string,string>();

/** Relative url(...) references (fonts) must keep pointing next to the stylesheet once inlined. */
export function absoluteCss(css:string,stylesheetURL:string){
 return css.replace(/url\((['"]?)([^'")]+)\1\)/g,(match,quote:string,target:string)=>{
  if(/^(?:data:|https?:|#)/i.test(target))return match;
  try{return `url(${quote}${new URL(target,stylesheetURL).href}${quote})`;}catch{return match;}
 }).replace(/<\/style/gi,'<\\/style');
}

async function stylesheet(url:string):Promise<string|null>{
 const hit=stylesheets.get(url);if(hit!==undefined)return hit;
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(1500)});
  if(!response.ok||!/text\/css/i.test(response.headers.get('Content-Type')||''))return null;
  const css=await response.text();if(css.length>MAX_CSS_BYTES)return null;
  const value=absoluteCss(css,url);
  if(stylesheets.size>=4)stylesheets.delete(stylesheets.keys().next().value!);
  stylesheets.set(url,value);return value;
 }catch{return null;}
}

export function inlineHead(head:string,css:string,href:string){
 return head.replace(ROOT_CSS,()=>`<style data-inline-css="root">${css}</style><link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"/>`);
}

function indexOf(bytes:Uint8Array,pattern:Uint8Array){outer:for(let i=0;i<=bytes.length-pattern.length;i++){for(let j=0;j<pattern.length;j++)if(bytes[i+j]!==pattern[j])continue outer;return i;}return -1;}

export async function inlineRootStylesheet(request:Request,response:Response):Promise<Response>{
 const url=new URL(request.url);
 if(request.method!=='GET'||response.status!==200||!response.body||url.pathname.endsWith('.data')||!/^text\/html/i.test(response.headers.get('Content-Type')||''))return response;
 const reader=response.body.getReader(),encoder=new TextEncoder(),marker=encoder.encode('</head>');
 // Work on bytes: only the complete head (pure markup up to the ASCII "</head>") is decoded and rewritten;
 // everything after it streams through untouched, so no multi-byte character can be split.
 let buffered=new Uint8Array(0),done=false,end=-1;
 while(end<0&&buffered.length<MAX_HEAD_BYTES){const chunk=await reader.read();if(chunk.done){done=true;break;}const next=new Uint8Array(buffered.length+chunk.value.length);next.set(buffered);next.set(chunk.value,buffered.length);buffered=next;end=indexOf(buffered,marker);}
 let first:Uint8Array=buffered;
 if(end>=0){
  const head=new TextDecoder().decode(buffered.subarray(0,end)),match=ROOT_CSS.exec(head);
  if(match){const css=await stylesheet(new URL(match[1],url).href);if(css){const rewritten=encoder.encode(inlineHead(head,css,match[1])),rest=buffered.subarray(end);first=new Uint8Array(rewritten.length+rest.length);first.set(rewritten);first.set(rest,rewritten.length);}}
 }
 const body=new ReadableStream<Uint8Array>({
  start(controller){controller.enqueue(first);if(done)controller.close();},
  async pull(controller){try{const chunk=await reader.read();if(chunk.done)controller.close();else controller.enqueue(chunk.value);}catch(error){controller.error(error);}},
  cancel(reason){return reader.cancel(reason);},
 });
 const headers=new Headers(response.headers);headers.delete('Content-Length');
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}
