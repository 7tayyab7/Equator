import test from 'node:test';
import assert from 'node:assert/strict';
import {nextPageCursor} from '../app/lib/pagination.ts';
test('repeated and non-adjacent repeated cursors cannot create an endless catalogue loop',()=>{
 const seen=new Set();assert.equal(nextPageCursor({hasNextPage:true,endCursor:'a'},seen),'a');assert.equal(nextPageCursor({hasNextPage:true,endCursor:'b'},seen),'b');assert.throws(()=>nextPageCursor({hasNextPage:true,endCursor:'a'},seen));
});
test('missing cursors and page-limit violations fail instead of caching an incomplete catalogue',()=>{
 for(const endCursor of [null,''])assert.throws(()=>nextPageCursor({hasNextPage:true,endCursor},new Set()));
 assert.throws(()=>nextPageCursor({hasNextPage:true,endCursor:'next'},new Set(['previous']),1));
 assert.equal(nextPageCursor({hasNextPage:false,endCursor:null},new Set()),null);
});
