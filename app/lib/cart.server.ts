import type {ShopifyRequestContext} from '@shopify/hydrogen';
import {displayProductTitle} from './product-helpers';
import {createCookie} from 'react-router';
import {requestStorefront} from './storefront.server';
export type Cart={id:string;updatedAt:string;totalQuantity:number;checkoutUrl:string;discountCodes:{code:string;applicable:boolean}[];cost:{totalAmount:{amount:string;currencyCode:string};subtotalAmount:{amount:string;currencyCode:string}};lines:{nodes:{id:string;quantity:number;cost:{totalAmount:{amount:string;currencyCode:string};amountPerQuantity:{amount:string;currencyCode:string}};merchandise:{id:string;title:string;product:{id:string;title:string;handle:string;vendor:string};image:{url:string;altText:string|null}|null;price:{amount:string;currencyCode:string}}}[]}};
const fields=`id updatedAt totalQuantity checkoutUrl discountCodes{code applicable} cost{totalAmount{amount currencyCode} subtotalAmount{amount currencyCode}} lines(first:100){nodes{id quantity cost{totalAmount{amount currencyCode} amountPerQuantity{amount currencyCode}} merchandise{... on ProductVariant{id title product{id title handle vendor} image{url altText} price{amount currencyCode}}}}}`;
export const cartCookie=createCookie('equator_preview_cart',{httpOnly:true,sameSite:'lax',path:'/',maxAge:60*60*24*30});
export async function readCart(env:Record<string,string>,id:string,signal:AbortSignal,requestContext?:ShopifyRequestContext){const result=await requestStorefront<{cart:Cart|null}>(env,`query Cart($id:ID!) @inContext(country:PK){cart(id:$id){${fields}}}`,{id},signal,requestContext);return result.cart?{...result.cart,lines:{nodes:result.cart.lines.nodes.map(line=>({...line,merchandise:{...line.merchandise,product:{...line.merchandise.product,title:displayProductTitle(line.merchandise.product.title)}}}))}}:null;}
export async function changeCart(env:Record<string,string>,id:string|null,input:{action:string;variant?:string;line?:string;quantity:number;codes?:string[]},signal:AbortSignal,requestContext?:ShopifyRequestContext){
 let operation:string,variables:Record<string,unknown>,args:string;
 if(input.action==='discount'){if(!id)throw new Response('Add an item before applying a code.',{status:409});operation='cartDiscountCodesUpdate';args='$cartId:ID!,$discountCodes:[String!]!';variables={cartId:id,discountCodes:input.codes||[]};
 }else if(input.action==='add'){
 if(id){operation='cartLinesAdd';args='$cartId:ID!,$lines:[CartLineInput!]!';variables={cartId:id,lines:[{merchandiseId:input.variant,quantity:input.quantity}]};}
 else {operation='cartCreate';args='$input:CartInput!';variables={input:{buyerIdentity:{countryCode:'PK'},lines:[{merchandiseId:input.variant,quantity:input.quantity}]}};}
 }else{if(!id)throw new Response('Your bag has expired. Please add the item again.',{status:409});operation='cartLinesUpdate';args='$cartId:ID!,$lines:[CartLineUpdateInput!]!';variables={cartId:id,lines:[{id:input.line,quantity:input.quantity}]};}
 const result=await requestStorefront<Record<string,{cart:Cart|null;userErrors:{message:string}[];warnings?:{message:string}[]}>>(env,`mutation ChangeCart(${args}) @inContext(country:PK){${operation}(${operation==='cartCreate'?'input:$input':operation==='cartDiscountCodesUpdate'?'cartId:$cartId,discountCodes:$discountCodes':'cartId:$cartId,lines:$lines'}){cart{${fields}} userErrors{message} warnings{message}}}`,variables,signal,requestContext);
 const payload=result[operation];if(payload.userErrors.length||!payload.cart)throw new Response(payload.userErrors.map(e=>e.message).join(' ')||'Could not update your bag.',{status:422});
 payload.cart.lines.nodes.forEach(line=>{line.merchandise.product.title=displayProductTitle(line.merchandise.product.title);});
 return {cart:payload.cart,warnings:payload.warnings?.map(w=>w.message)||[]};
}
