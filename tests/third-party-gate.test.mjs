import test from 'node:test';import assert from 'node:assert/strict';
import {createThirdPartyGate} from '../app/lib/third-party-gate.ts';

/** A controllable fake page: nothing happens until the test fires load, idle, interaction or the timer. */
function fakePage(readyState='loading'){
 const page={readyState,loadCallbacks:[],idleCallbacks:[],interaction:undefined,timers:[],removed:0,clock:0};
 return {page,environment:{
  readyState,
  onLoad:callback=>page.loadCallbacks.push(callback),
  onInteraction:callback=>{page.interaction=callback;return()=>{page.removed++;};},
  idle:(callback,timeout)=>page.idleCallbacks.push({callback,timeout}),
  setTimer:(callback,ms)=>page.timers.push({callback,ms}),
  now:()=>page.clock,
 }};
}

test('vendor scripts wait while the page loads, then run once the page is loaded and the browser is idle',()=>{
 const {page,environment}=fakePage(),ran=[];const gate=createThirdPartyGate(environment);
 gate.run(()=>ran.push('meta'));gate.run(()=>ran.push('tiktok'));
 assert.deepEqual(ran,[]);assert.equal(gate.isOpen(),false);
 page.loadCallbacks.forEach(callback=>callback());
 assert.deepEqual(ran,[],'load alone is not enough: the browser must also be idle');
 assert.equal(page.idleCallbacks[0].timeout,4000);
 page.clock=2400;page.idleCallbacks[0].callback();
 assert.deepEqual(ran,['meta'],'one vendor script per quiet moment');
 assert.equal(page.idleCallbacks[1].timeout,2000);page.idleCallbacks[1].callback();
 assert.deepEqual(ran,['meta','tiktok']);assert.equal(gate.reason(),'page-loaded-and-idle');assert.equal(gate.openedAt(),2400);
 assert.equal(page.removed,1,'interaction listeners are removed once open');
});

test('a tap, key or scroll opens the gate at the next idle moment (at most 4 s), so the tapped page renders first',()=>{
 const {page,environment}=fakePage(),ran=[];const gate=createThirdPartyGate(environment);
 gate.run(()=>ran.push('google'));page.interaction();
 assert.deepEqual(ran,[],'vendor code never runs inside the tap itself');
 assert.equal(page.idleCallbacks.length,1);assert.equal(page.idleCallbacks[0].timeout,4000);
 page.interaction();assert.equal(page.idleCallbacks.length,1,'repeated taps schedule only one opening');
 page.idleCallbacks[0].callback();
 assert.deepEqual(ran,['google']);assert.equal(gate.reason(),'visitor-interaction');
});

test('a slow page still reports: the safety cap opens the gate after 5 seconds by default',()=>{
 const {page,environment}=fakePage(),ran=[];const gate=createThirdPartyGate(environment);
 gate.run(()=>ran.push('snap'));assert.equal(page.timers[0].ms,5000);
 page.timers[0].callback();assert.deepEqual(ran,[]);page.idleCallbacks.at(-1).callback();assert.deepEqual(ran,['snap']);assert.equal(gate.reason(),'safety-cap');
});

test('an already-loaded page only waits for idle; tasks after opening run straight away and only once',()=>{
 const {page,environment}=fakePage('complete'),ran=[];const gate=createThirdPartyGate(environment,{idleTimeoutMs:800,maxWaitMs:3000});
 assert.equal(page.loadCallbacks.length,0);assert.equal(page.idleCallbacks[0].timeout,800);assert.equal(page.timers[0].ms,3000);
 gate.run(()=>ran.push('a'));page.idleCallbacks[0].callback();page.interaction();page.timers[0].callback();
 gate.run(()=>ran.push('b'));
 assert.deepEqual(ran,['a','b']);assert.equal(gate.reason(),'page-loaded-and-idle');
});

test('one failing vendor never stops the others',()=>{
 const {page,environment}=fakePage(),ran=[];const gate=createThirdPartyGate(environment);
 gate.run(()=>{throw new Error('blocked by an ad blocker');});gate.run(()=>ran.push('meta'));
 const drainIdle=()=>{for(let i=0;i<page.idleCallbacks.length;i++)page.idleCallbacks[i].callback();};
 page.interaction();drainIdle();assert.deepEqual(ran,['meta']);
 gate.run(()=>{throw new Error('again');});gate.run(()=>ran.push('tiktok'));drainIdle();assert.deepEqual(ran,['meta','tiktok']);
});

test('outside a real browser page (server rendering, unit tests) nothing is held back',()=>{
 const ran=[];const gate=createThirdPartyGate(null);gate.run(()=>ran.push('x'));
 assert.deepEqual(ran,['x']);assert.equal(gate.reason(),'no-browser-page');
});

test('while the shopper is changing page, no vendor script starts; it starts once the new page is showing',()=>{
 const {page,environment}=fakePage('complete'),ran=[];let navigating=true;const gate=createThirdPartyGate({...environment,busy:()=>navigating});
 gate.run(()=>ran.push('google'));page.idleCallbacks[0].callback();
 assert.deepEqual(ran,[],'held during the page change');assert.equal(page.timers.at(-1).ms,300);
 navigating=false;page.timers.at(-1).callback();assert.deepEqual(ran,['google']);
});
