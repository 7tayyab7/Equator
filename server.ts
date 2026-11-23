import {indexingEnabled,robotsForURL} from './app/lib/seo';
import {bindQueryRuntime,queryTimingHeader} from './app/lib/query-runtime.server';
import {hostedHandoff} from './app/lib/hosted-store';
import {legacyTarget} from './app/lib/seo-redirects';
import {createRequestHandler, RouterContextProvider} from 'react-router';
import * as serverBuild from 'virtual:react-router/server-build';
import {environmentContext,searchCacheContext} from './app/storefront.context';
import {pageFailure} from './app/lib/page-error.server';
import {withPakistanOnly} from './app/lib/pakistan-only.server';
import {ensureCookieHeaderAPI} from './app/lib/cookie-headers.server';
import {withPageDeadline} from './app/lib/page-deadline.server';
import {inlineRootStylesheet} from './app/lib/inline-css.server';

const handleRequest = createRequestHandler(serverBuild, 'production');
export default {
  async fetch(request: Request, bindings: Record<string, string> & Env, executionContext: ExecutionContext) {
    const env={...bindings};
    ensureCookieHeaderAPI();
    return withPakistanOnly(request, env, async () => {
    const started=performance.now();
    const metrics:Parameters<typeof queryTimingHeader>[0]=[];
    let publicCache;try{publicCache=await caches.open('equator-public-queries-v1');}catch{}
    bindQueryRuntime(env,{cache:publicCache,metrics,path:new URL(request.url).pathname,waitUntil:executionContext.waitUntil.bind(executionContext),cacheEnabled:true});
    const context = new RouterContextProvider();
    context.set(environmentContext, env);
    if(new URL(request.url).pathname.startsWith('/search')){
      try{context.set(searchCacheContext,{cache:await caches.open('equator-search'),waitUntil:executionContext.waitUntil.bind(executionContext)});}catch{/* The in-memory search cache remains available outside Oxygen. */}
    }
    try {
      const url=new URL(request.url),handoff=hostedHandoff(request,env),legacy=request.method==='GET'&&!url.pathname.endsWith('.data')?legacyTarget(url):null;
      const response=await withPageDeadline(request,async scopedRequest=>{
        const routed=handoff?new Response(null,{status:307,headers:{Location:handoff,'Cache-Control':'private, no-store'}}):legacy?new Response(null,{status:301,headers:{Location:legacy}}):await inlineRootStylesheet(scopedRequest,await handleRequest(scopedRequest, context));
        return routed;
      });
      response.headers.append('Server-Timing',`storefront;dur=${Math.round(performance.now()-started)}`);
      const timings=queryTimingHeader(metrics);if(timings)response.headers.append('Server-Timing',timings);
      response.headers.set('X-Robots-Tag',robotsForURL(url,indexingEnabled(request,env),response.status));
      return response;
    } catch (error) {
      console.error('Oxygen request failed', error);
      return pageFailure(request,error);
    }
    });
  },
};
