import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
test('no link prefetches page data on touch: a tap makes one data request (two identical requests made the browser wait up to ~20 s)',()=>{
 for(const file of walk('app').filter(f=>f.endsWith('.tsx')))assert.doesNotMatch(fs.readFileSync(file,'utf8'),/prefetch="(intent|render|viewport)"/,file);
});
