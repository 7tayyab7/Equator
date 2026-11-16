import {indexingEnabled,robotsForURL} from './app/lib/seo';
import {hostedHandoff} from './app/lib/hosted-store';
import {legacyTarget} from './app/lib/seo-redirects';
import {createRequestHandler, RouterContextProvider} from 'react-router';
import * as serverBuild from 'virtual:react-router/server-build';
import {environmentContext,searchCacheContext} from './app/storefront.context';
import {completePageResponse,ResponseDeliveryError} from './app/lib/response-delivery.server';
import {withPakistanOnly} from './app/lib/pakistan-only.server';
import {ensureCookieHeaderAPI} from './app/lib/cookie-headers.server';
import {withPageDeadline,PageDeadlineError} from './app/lib/page-deadline.server';

const handleRequest = createRequestHandler(serverBuild, 'production');
export default {
  async fetch(request: Request, env: Record<string, string> & Env, executionContext: ExecutionContext) {
    ensureCookieHeaderAPI();
    return withPakistanOnly(request, env, async () => {
    const started=performance.now();
    const context = new RouterContextProvider();
    context.set(environmentContext, env);
    if(new URL(request.url).pathname.startsWith('/search')){
      try{context.set(searchCacheContext,{cache:await caches.open('equator-search'),waitUntil:executionContext.waitUntil.bind(executionContext)});}catch{/* The in-memory search cache remains available outside Oxygen. */}
    }
    try {
      const url=new URL(request.url),handoff=hostedHandoff(request,env),legacy=request.method==='GET'&&!url.pathname.endsWith('.data')?legacyTarget(url):null;
      const response=await withPageDeadline(request,async scopedRequest=>{
        const routed=handoff?new Response(null,{status:307,headers:{Location:handoff,'Cache-Control':'private, no-store'}}):legacy?new Response(null,{status:301,headers:{Location:legacy}}):await handleRequest(scopedRequest, context);
        return completePageResponse(scopedRequest,routed);
      });
      response.headers.append('Server-Timing',`storefront;dur=${Math.round(performance.now()-started)}`);
      response.headers.set('X-Robots-Tag',robotsForURL(url,indexingEnabled(request,env),response.status));
      return response;
    } catch (error) {
      console.error('Oxygen request failed', error);
      if(error instanceof ResponseDeliveryError||error instanceof PageDeadlineError)return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Equator — Please try again</title><main><h1>Please try again</h1><p>This page could not finish loading.</p><a href="">Reload this page</a> · <a href="/">Home</a></main></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Retry-After':'10','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
      return new Response('The preview is temporarily unavailable. Please try again.', {status:500,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
    }
    });
  },
};
