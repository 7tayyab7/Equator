import {PageDeadlineError} from './page-deadline.server.ts';
export function pageFailure(request:Request,error:unknown){
 const timeout=error instanceof PageDeadlineError;
 if(new URL(request.url).pathname.endsWith('.data'))return new Response(timeout?'Timeout':"We couldn't load this page. Please try again.",{status:timeout?503:500,headers:{'Content-Type':'text/plain','Cache-Control':'no-store',...(timeout?{'Retry-After':'5'}:{})}});
 if(timeout)return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Equator — Please try again</title><main><h1>This page is taking longer than usual.</h1><p>Please try again in a moment.</p><a href="">Try again</a> · <a href="/">Return to Equator</a></main></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Retry-After':'5','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
 return new Response("We couldn't load this page. Please try again.",{status:500,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
}
