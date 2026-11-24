/**
 * Tell browsers NOT to switch this storefront to HTTP/3 (QUIC).
 *
 * Shopify's edge answers every equatorstores.com response with `alt-svc: h3=":443"; ma=86400`. On many networks in
 * Pakistan (home routers and mobile data) the HTTP/3 handshake succeeds but every later UDP packet is dropped. Chrome
 * then sends the visitor's next requests (bag, menu/banner clicks, analytics) into that silent connection and only
 * gives up after its 29-second idle timeout. Measured 24 Nov with Chrome's NetLog on a first visit: the HTTP/3 session
 * "received 0 packets after the handshake … No recent network activity after 29s", and a menu-style request waited
 * 9-29 s while the server answers it in 0.2 s. Repeat visits were fast only because Chrome remembers the failure.
 *
 * `Alt-Svc: clear` removes the HTTP/3 hint, so browsers keep using the normal HTTP/2 connection (TCP), which works on
 * these networks. Pages, assets and checkout are otherwise unchanged.
 */
export const ALT_SVC_CLEAR='clear';
export function withoutHttp3(response:Response):Response{
  try{response.headers.set('Alt-Svc',ALT_SVC_CLEAR);return response;}
  catch{// Responses passed through from fetch() have immutable headers: copy them first (body is streamed, not read).
    const copy=new Response(response.body,response);copy.headers.set('Alt-Svc',ALT_SVC_CLEAR);return copy;}
}
