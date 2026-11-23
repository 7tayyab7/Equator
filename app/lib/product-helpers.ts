import {isValidHandle} from './handle.ts';
export type Money={amount:string;currencyCode:string};
export type Variant={id:string;title:string;sku:string;availableForSale:boolean;selectedOptions:{name:string;value:string}[];price:Money;compareAtPrice:Money|null;image:{url:string;altText:string|null;width:number;height:number}|null};

export function selectedVariant(variants:Variant[],id:string|null) {
 return variants.find(v=>v.id===id||v.id.split('/').pop()===id)||null;
}
export function initialProductVariant(variants:Variant[],id:string|null){
 return selectedVariant(variants,id)||variants[0]||null;
}
export function variantForOption(variants:Variant[],previous:{name:string;value:string}[],name:string,value:string){
 const matches=variants.filter(v=>v.selectedOptions.some(o=>o.name===name&&o.value===value));
 return (previous.length?matches.find(v=>previous.every(o=>o.name===name||v.selectedOptions.some(n=>n.name===o.name&&n.value===o.value))):null)||matches.find(v=>v.availableForSale)||matches[0]||null;
}
export function uniqueAvailable<T extends {id:string;availableForSale:boolean}>(products:T[],excluded:string[],limit=8):T[] {
 const seen=new Set(excluded);return products.filter(p=>{if(seen.has(p.id)||!p.availableForSale)return false;seen.add(p.id);return true;}).slice(0,limit);
}
export function isWaistcoat(type:string){return /waist[\s-]*coat/i.test(type);}
export function complementaryTypes(type:string) {
 if(isWaistcoat(type))return ['Shalwar Kameez','Kurta Shalwar','Kurta Trouser','Kurta','Qaftan'];
 if(/formal|dress shirt/i.test(type))return ['Pants','Waistcoat'];
 if(/casual shirt/i.test(type))return ['Pants','Jeans'];
 if(/hoodie|sweat(?:shirt| shirt)|upper|active/i.test(type))return ['Joggers','Trouser Knit','Pants','Jeans'];
 if(/jacket/i.test(type))return ['Casual Shirt','Smart Casual Shirt','T-Shirt','Sweater','Pants','Jeans'];
 if(/blazer/i.test(type))return ['Formal Shirt','Smart Casual Shirt','Pants'];
 if(/shirt|polo|sweater/i.test(type))return ['Pants','Jeans','Cargo Pants','Trouser Knit'];
 if(/pant|trouser|jeans|jogger|short/i.test(type))return ['Casual Shirt','Smart Casual Shirt','Polo','T-Shirt','Formal Shirt','Sweater','Sweatshirt'];
 if(/kurta|shalwar|qaftan/i.test(type))return ['Waistcoat','Kurta Trouser','Ankle Socks'];
 if(/suit|coat|waistcoat/i.test(type))return ['Formal Shirt','Dress Shirt','Pants'];
 return ['Casual Shirt','Pants','Polo'];
}
export function complementaryProducts<T extends {id:string;title:string;productType:string;description:string;availableForSale:boolean}>(current:{id:string;productType:string},candidates:T[],excluded:string[]=[],limit=8):T[]{
 const types=complementaryTypes(current.productType);
 // Complete traditional outfits come first; never fall back to western shirts.
 if(isWaistcoat(current.productType)){
  const traditional=candidates.filter(p=>types.includes(p.productType)).sort((a,b)=>types.indexOf(a.productType)-types.indexOf(b.productType));
  return uniqueAvailable(traditional,[current.id,...excluded],limit);
 }
 const smart=/casual shirt|formal|dress|suit/i.test(current.productType);
 const allowed=candidates.filter(p=>{
  if(!types.includes(p.productType))return false;
  if(/pant|jeans|jogger|short|trouser/i.test(p.productType)&&/\b(?:tee|shirt|polo|hoodie|sweater)\b/i.test(p.title))return false;
  if(!smart)return true;
  const specs=[...p.description.matchAll(/(?:Style|Pattern|Fabric)\s*:\s*(.*?)(?=\s+\w+\s*:|$)/gi)].map(match=>match[1]).join(' ');
  const color=p.description.match(/Colou?r:\s*(.*?)(?=\s+(?:Collar|Sleeves?|Fit|Pattern|Style|Fabric)\s*:|$)/i)?.[1]||'';
  return !/(?:jogger|athleisure|track\s?suit|drawstring|gym|sport|knit|fleece|\btee\b|windowpane|plaid|check|stripe)/i.test(`${p.title} ${specs}`)&&(!color||/black|navy|grey|gray|beige|khaki|brown|indigo|white|charcoal|stone|sand/i.test(color));
 });
 return uniqueAvailable(allowed,[current.id,...excluded],limit);
}
export function updateHistory(ids:unknown,current:string):string[] {
 const valid=Array.isArray(ids)?ids.filter((id):id is string=>typeof id==='string'&&/^gid:\/\/shopify\/Product\/\d+$/.test(id)):[];
 return [...new Set([current,...valid])].slice(0,16);
}
export function colorLabel(description:string,title:string) {
 const label=description.replace(/<br\s*\/?\s*>|<\/li>|<\/p>/gi,'\n').replace(/<[^>]*>/g,' ').match(/Colou?r\s*:\s*([^\n<]+?)(?=\s{2}|Neck:|Collar:|Sleeves:|Fit:|Pattern:|Style:|Fabric:|$)/i)?.[1]?.trim();
 return label?.replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,entity:string)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[entity]||''))||title;
}

// Match the live theme: remove a final segment shorter than three characters,
// then check the base handle and its numbered color siblings (1–20).
export function colorProductHandles(handle:string):string[] {
 if(!isValidHandle(handle))return [];
 const parts=handle.split('-');
 if(parts.at(-1)!.length<3)parts.pop();
 const base=parts.join('-');
 if(!base)return [handle];
 return [...new Set([base,...Array.from({length:20},(_,i)=>`${base}-${i+1}`),handle])];
}

/** Keep merchant naming intact apart from a stray lowercase initial. */
export function displayProductTitle(title:string){const value=title.trim();return value.charAt(0).toUpperCase()+value.slice(1);}
