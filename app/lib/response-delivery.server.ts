export class ResponseDeliveryError extends Error {
  constructor(message: string) { super(message); this.name = 'ResponseDeliveryError'; }
}

// Complete document/data streams inside the worker lifetime. Never share/cache a
// shopper's response, or change the streaming behavior of checkout/API routes.
export async function completePageResponse(request: Request, response: Response, timeoutMs = 10_000): Promise<Response> {
  const url = new URL(request.url), path = url.pathname;
  if (request.method !== 'GET' || response.status !== 200 || !response.body ||
      /^\/(?:api|__shopify|resources|cart|bag|account)(?:\/|$)/.test(path) ||
      !/^text\/(?:html|x-script)(?:;|$)/i.test(response.headers.get('Content-Type') || '')) return response;

  const started = performance.now(), reader = response.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ResponseDeliveryError('Page response stream exceeded its completion deadline')), timeoutMs);
  });
  try {
    const body = await Promise.race([(async () => {
      const chunks: Uint8Array[] = []; let length = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        chunks.push(chunk.value); length += chunk.value.byteLength;
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return bytes;
    })(), deadline]);
    reader.releaseLock();
    const headers = new Headers(response.headers);
    headers.delete('Transfer-Encoding');
    headers.set('Content-Length', String(body.byteLength));
    headers.set('X-Equator-Response-Bytes', String(body.byteLength));
    headers.append('Server-Timing', `response_body;dur=${Math.round(performance.now() - started)}`);
    const trace = url.searchParams.get('__delivery_trace');
    if (trace && /^[a-z0-9-]{1,64}$/i.test(trace)) console.info('Equator page bytes completed', {trace, path, bytes: body.byteLength});
    return new Response(body, {status: response.status, statusText: response.statusText, headers});
  } catch (error) {
    // Do not wait for a broken underlying stream's cancellation to settle.
    void reader.cancel().catch(() => {});
    throw error instanceof ResponseDeliveryError ? error : new ResponseDeliveryError('Page response stream failed before completion');
  } finally { if (timer !== undefined) clearTimeout(timer); }
}
