export function appendUniqueProducts<T extends {id:string}>(previous:T[],incoming:T[]):T[]{
 const seen=new Set(previous.map(product=>product.id));return [...previous,...incoming.filter(product=>{if(seen.has(product.id))return false;seen.add(product.id);return true;})];
}
