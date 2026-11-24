import {useEffect,useId,useRef,useState} from 'react';
import {staticAsset} from '../lib/static-assets';
import {loadJSON} from '../lib/json-request.client';
import {baadmayInstallment,type BaadmayConfig} from '../lib/baadmay';
import type {Money} from '../lib/product-helpers';
let configRequest:Promise<BaadmayConfig|null>|null=null,expires=0;
function getConfig(){if(!configRequest||Date.now()>expires){expires=Date.now()+300000;configRequest=loadJSON<{config:BaadmayConfig|null}>('/resources/baadmay',{},8000).then(data=>data.config).catch(()=>null).then(value=>{if(!value)expires=Date.now()+15000;return value;});}return configRequest;}
const rupees=(amount:number)=>`Rs. ${new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format(amount)}`;
export function BaadmayWidget({price}:{price:Money}){
 const [config,setConfig]=useState<BaadmayConfig|null>(null),[open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),id=useId(),title=useId();
 useEffect(()=>{let active=true;void getConfig().then(value=>{if(active)setConfig(value);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();return()=>{dialog.current?.close();if(previous?.isConnected)previous.focus();};},[open]);
 const installment=baadmayInstallment(Number(price.amount),price.currencyCode,config);
 if(price.currencyCode!=='PKR')return null;
 return <div className="pdp-baadmay">
  <button type="button" className="baadmay-trigger" aria-haspopup="dialog" aria-controls={id} aria-expanded={open} onClick={()=>setOpen(true)}><img src={staticAsset('/images/payments/baadmay.svg')} width="99" height="31" alt="Baadmay"/><span>Pay in 3 installments{installment!==null?<> of <strong>{rupees(installment)}</strong></>:<> · <strong>Learn more</strong></>}</span><span className="baadmay-info" aria-hidden="true">i</span></button>
  <dialog ref={dialog} id={id} className="baadmay-dialog" aria-labelledby={title} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget){const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)setOpen(false);}}}>
   <button type="button" className="baadmay-close" aria-label="Close Baadmay information" onClick={()=>setOpen(false)}>×</button>
   <img className="baadmay-dialog-logo" src={staticAsset('/images/payments/baadmay.svg')} width="116" height="36" alt="Baadmay"/>
   <h2 id={title}>Pay in 3 easy installments</h2><p className="baadmay-intro">Thora abhi, baqi Baadmay.</p>
   {installment!==null&&<p className="baadmay-estimate">Estimated installment <strong>{rupees(installment)}</strong></p>}
   <ol className="baadmay-steps"><li><span aria-hidden="true">1</span>Select Baadmay at checkout</li><li><span aria-hidden="true">2</span>Verify your Baadmay account details</li><li><span aria-hidden="true">3</span>Pay your first installment; the next two are due monthly</li></ol>
   {config&&<p className="baadmay-terms">{installment!==null?`This estimate includes Equator’s current ${config.fee}% Baadmay fee. `:''}Merchant shopping range: {rupees(config.min)}–{rupees(config.max)}. {installment===null?'Your selected product is outside this range; eligibility depends on your final cart. ':''}Your available Baadmay limit and approval apply. Shipping, discounts and the final payment schedule are confirmed at checkout.</p>}
   {!config&&<p className="baadmay-terms">Select Baadmay at checkout to see the current fees and installment plan. Availability depends on your order and Baadmay account approval.</p>}
   <a className="baadmay-learn" href="https://baadmay.com/support.html" target="_blank" rel="noopener noreferrer">How Baadmay works ↗</a>
  </dialog>
 </div>;
}
