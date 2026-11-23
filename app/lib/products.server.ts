export type ProductImage={url:string;width:number;height:number;alt:string};
export type ProductCardData={id:string;title:string;handle:string;price:number;compareAtPrice?:number;currency:string;priceVaries:boolean;images:ProductImage[];available?:boolean};
