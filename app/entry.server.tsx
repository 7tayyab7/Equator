import {isbot} from 'isbot';
export const streamTimeout=20000;
import {renderToReadableStream} from 'react-dom/server.edge';
import {ServerRouter, type EntryContext} from 'react-router';

export default async function handleRequest(request: Request, status: number, headers: Headers, context: EntryContext) {
  const stream = await renderToReadableStream(<ServerRouter context={context} url={request.url}/>, {
    signal: request.signal,
    onError(error) {console.error(error); status = 500;},
  });
  if(isbot(request.headers.get('user-agent')||''))await stream.allReady;
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(stream, {status, headers});
}
