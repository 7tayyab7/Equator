import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CampaignWheelGesture} from '../app/lib/campaign-gesture.ts';

test('steady wheel events never require a quiet period or pointer movement',()=>{
 const gate=new CampaignWheelGesture();let accepted=0,until=-1;
 for(let t=0;t<10000;t+=80) {if(gate.accept(100,t,t<until)){accepted++;until=t+900;}}
 assert.ok(accepted>=8&&accepted<=10);
});
test('a trackpad burst including its decreasing momentum opens one slide',()=>{
 const gate=new CampaignWheelGesture();let count=0;
 for(let t=0;t<1600;t+=16) if(gate.accept(90*Math.exp(-t/220),t,t>0&&t<900))count++;
 assert.equal(count,1);
});
test('reverse immediately after settling without pointer input',()=>{
 const gate=new CampaignWheelGesture();assert.equal(gate.accept(80,0,false),true);
 gate.accept(20,850,true);
 assert.equal(gate.accept(-80,920,false),true);
 assert.equal(gate.accept(-40,940,true),false);
 assert.equal(gate.accept(80,1850,false),true);
});
test('fresh gestures, tiny deltas, reset and invalid deltas',()=>{
 const gate=new CampaignWheelGesture();assert.equal(gate.accept(NaN,0,false),false);
 assert.equal(gate.accept(0,0,false),false);
 assert.equal(gate.accept(4,0,false),false);
 assert.equal(gate.accept(4,16,false),false);
 assert.equal(gate.accept(4,32,false),true);
 gate.reset();assert.equal(gate.accept(-80,40,false),true);
});
