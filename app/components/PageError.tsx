import {useEffect,useState} from 'react';
import {Link,isRouteErrorResponse,useRouteError} from 'react-router';
const RETRY_KEY='equator-page-retry';
/** Weak or dropped connections: a failed in-app page load is retried once as a normal full page load, which the browser itself retries and streams. */
export function shouldRetryPage(error:unknown){return !(isRouteErrorResponse(error)&&error.status>=400&&error.status<500);}
function retryOnce(){try{const now=Date.now(),last=JSON.parse(sessionStorage.getItem(RETRY_KEY)||'null') as {url:string;at:number}|null;if(last&&last.url===location.href&&now-last.at<60_000)return false;sessionStorage.setItem(RETRY_KEY,JSON.stringify({url:location.href,at:now}));}catch{return false;}window.location.reload();return true;}
export function PageError(){const error=useRouteError(),missing=isRouteErrorResponse(error)&&error.status===404;const [retrying,setRetrying]=useState(()=>!missing&&shouldRetryPage(error));
 // Same first render on server and client; the retry decision runs only in the browser.
 useEffect(()=>{if(retrying&&!retryOnce())setRetrying(false);},[retrying]);
 if(retrying)return <section className="collection-page collection-error px-6 py-16 text-center" data-page-retrying="true" aria-busy="true"><p role="status">Loading…</p></section>;
 return <section className="collection-page collection-error px-6 py-16 text-center" data-page-error="true"><h1 className="mb-4 text-2xl">{missing?'Page not found':'This page is taking longer than usual.'}</h1><p className="mb-6">{missing?'Please explore another Equator page.':'Please try again in a moment.'}</p><div className="flex justify-center gap-6"><button type="button" className="underline" onClick={()=>window.location.reload()}>Try again</button><Link className="underline" to="/">Return to Equator</Link></div></section>;}
