import test from 'node:test';
import assert from 'node:assert/strict';
import {fitMenuIndices} from '../app/lib/navigation-fit.ts';
import navigation from '../app/content/navigation.json' with {type:'json'};
const widths=[44,75,56,56,85,105];
test('Accessories is final group before More with only verified live children',()=>{
 const group=navigation.header.at(-1);assert.equal(group.title,'Accessories');assert.equal(group.href,'/collections/accessories');
 assert.deepEqual(group.children,[{title:'Caps',href:'/collections/wwbeanies'},{title:'Belt',href:'/collections/belt'},{title:'Socks',href:'/collections/socks'}]);
});
test('full desktop fits all links while narrow desktop retains Accessories immediately before More',()=>{
 assert.deepEqual(fitMenuIndices(widths,48,700,16,5),[0,1,2,3,4,5]);
 const narrow=fitMenuIndices(widths,48,480,16,5);assert.deepEqual(narrow,[0,1,2,3,5]);
 assert.ok(narrow.reduce((sum,index)=>sum+widths[index]+16,48)<=480);
 assert.equal(fitMenuIndices(widths,48,260,16,5).at(-1),5);
});
test('insufficient space preserves More and menus without a pin still fit a prefix',()=>{
 assert.deepEqual(fitMenuIndices(widths,48,100,16,5),[]);
 assert.deepEqual(fitMenuIndices([40,50,60],40,160,10,-1),[0,1]);
});

test('all six categories fit the measured standard desktop header with its12px gap',()=>{assert.deepEqual(fitMenuIndices([50.5,78.7,55.2,57.2,84.2,99.9],56,554,12,5),[0,1,2,3,4,5]);});
