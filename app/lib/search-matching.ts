const words=(value:string)=>value.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[];
const singular=(value:string)=>value.length>3&&value.endsWith('s')?value.slice(0,-1):value;
export function searchScore(product:{title:string;productType:string;handle:string;description:string;skus?:string[]},query:string){
 const terms=words(query).map(singular);
 if(!terms.length)return 0;
 // A SKU belongs to an individual variant, not the product handle or description.
 const code=words(query).join('');
 const codes=(product.skus||[]).map(sku=>words(sku).join('')).filter(Boolean);
 if(codes.includes(code))return 1000;
 if(code.length>=3&&/\d/.test(code)&&codes.some(sku=>sku.startsWith(code)))return 500;
 // Search product identity and actual labelled specifications, not SEO boilerplate.
 const specifications=[...product.description.matchAll(/(?:Color|Colour|Fabric|Fit|Pattern|Collar|Sleeves?)\s*:\s*(.*?)(?=\s+(?:Color|Colour|Fabric|Fit|Pattern|Collar|Sleeves?|Style)\s*:|$)/gi)].map(match=>match[1]).join(' ');
 const title=words(product.title).map(singular),type=words(product.productType).map(singular);
 const identity=[...title,...type,...words(product.handle).map(singular),...words(specifications).map(singular)];
 if(!terms.every(term=>identity.includes(term)))return 0;
 return terms.reduce((score,term)=>score+(title.includes(term)?10:type.includes(term)?6:1),0)+(product.title.toLowerCase().includes(query.toLowerCase())?20:0);
}
