/** Reject broken upstream cursors instead of looping or caching a partial catalogue. */
export function nextPageCursor(page:{hasNextPage:boolean;endCursor:string|null},seen:Set<string>,limit=1000):string|null {
  if(!page.hasNextPage)return null;
  const cursor=page.endCursor;
  if(typeof cursor!=='string'||!cursor||cursor.length>4096||seen.has(cursor)||seen.size>=limit)throw new Error('Catalogue pagination did not advance');
  seen.add(cursor);return cursor;
}
