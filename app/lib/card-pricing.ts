/** A range is only safe to advertise as one markdown when both ranges are uniform. */
export function cardCompareAt(price:number,maximum:number,minimumCompare?:number,maximumCompare?:number):number|undefined {
 return price===maximum&&typeof minimumCompare==='number'&&Number.isFinite(minimumCompare)&&minimumCompare===maximumCompare&&minimumCompare>price?minimumCompare:undefined;
}

/** Only advertise a rounded discount for a valid single-price markdown. */
export function discountPercent(price:number,compareAt?:number):number|undefined {
 if(!Number.isFinite(price)||price<0||typeof compareAt!=='number'||!Number.isFinite(compareAt)||compareAt<=price)return;
 const percent=Math.round((compareAt-price)/compareAt*100);
 return percent>=1&&percent<=100?percent:undefined;
}
