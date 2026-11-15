import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBaadmayConfig,baadmayInstallment} from '../app/lib/baadmay.ts';
const row={merchant_name:'equatorstores.myshopify.com',fee:15,min_shop_limit:'1,000',max_shop_limit:'30,000'};
const config=parseBaadmayConfig([row]);
test('live merchant fee and comma-separated limits are read without using another merchant',()=>{
 assert.deepEqual(config,{fee:15,min:1000,max:30000});assert.equal(parseBaadmayConfig([{...row,merchant_name:'other-store'}]),null);
});
test('estimate matches live widget, uses actual selected price and includes the merchant fee',()=>{
 assert.equal(baadmayInstallment(2175,'PKR',config),833);
 assert.equal(baadmayInstallment(4650,'PKR',config),1782);
 assert.equal(baadmayInstallment(3000,'PKR',{...config,fee:0}),1000);
});
test('no financial amount is invented on missing fees, invalid currency or outside current merchant limits',()=>{
 for(const price of [0,-1,999,30001,NaN,Infinity])assert.equal(baadmayInstallment(price,'PKR',config),null);
 assert.equal(baadmayInstallment(2175,'USD',config),null);assert.equal(baadmayInstallment(2175,'PKR',null),null);
 assert.notEqual(baadmayInstallment(1000,'PKR',config),null);assert.notEqual(baadmayInstallment(30000,'PKR',config),null);
});
test('invalid provider payload does not silently turn into a zero-fee quote',()=>{
 for(const payload of [null,{},[],[{...row,fee:null}],[{...row,fee:-1}],[{...row,fee:'bad'}],[{...row,min_shop_limit:'unknown'}],[{...row,max_shop_limit:'999'}]])assert.equal(parseBaadmayConfig(payload),null);
});
