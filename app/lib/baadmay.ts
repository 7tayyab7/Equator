export type BaadmayConfig={fee:number;min:number;max:number};
const amount=(value:unknown)=>typeof value==='number'?value:typeof value==='string'&&/^\d[\d,]*(?:\.\d+)?$/.test(value.trim())?Number(value.replaceAll(',','')):NaN;
export function parseBaadmayConfig(data:unknown):BaadmayConfig|null {
 if(!Array.isArray(data))return null;
 const row=data.find(value=>value&&value.merchant_name==='equatorstores.myshopify.com');if(!row)return null;
 const fee=amount(row.fee),min=amount(row.min_shop_limit),max=amount(row.max_shop_limit);
 return Number.isFinite(fee)&&fee>=0&&fee<=100&&Number.isFinite(min)&&min>0&&Number.isFinite(max)&&max>=min?{fee,min,max}:null;
}
// Match the existing Equator widget's floor((price + percentage fee) / 3).
// This is an indicative product amount, never a customer credit decision.
export function baadmayInstallment(price:number,currency:string,config:BaadmayConfig|null):number|null {
 if(!config||currency!=='PKR'||!Number.isFinite(price)||price<config.min||price>config.max)return null;
 return Math.floor((price*(100+config.fee))/300);
}
