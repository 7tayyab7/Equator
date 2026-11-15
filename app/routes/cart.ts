import type {Route} from './+types/cart';
import {storefrontContext,environmentContext} from '../storefront.context';
import {cartCookie,changeCart,readCart} from '../lib/cart.server';
const headers={'Cache-Control':'private, no-store'};
export async function loader({request,context}:Route.LoaderArgs){try{const id=await cartCookie.parse(request.headers.get('Cookie'));const cart=typeof id==='string'?await readCart(context.get(environmentContext),id,request.signal,context.get(storefrontContext).requestContext):null;return Response.json({cart},{headers});}catch{return Response.json({error:'Your bag could not be loaded. Please try again.'},{status:503,headers});}}
export async function action({request,context}:Route.ActionArgs){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({error:'Please submit from this storefront.'},{status:403,headers});
 try{
 const form=await request.formData(),action=String(form.get('action')),quantity=Number(form.get('quantity')),variant=String(form.get('variant')||''),line=String(form.get('line')||''),code=String(form.get('code')||'').trim();
 if(!['add','buy','update','discount'].includes(action)||!Number.isInteger(quantity)||quantity<0||quantity>99||((action==='add'||action==='buy')&&(!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variant)||quantity<1))||(action==='discount'&&(code.length>100||/[\r\n]/.test(code)))||(action==='update'&&!line.startsWith('gid://shopify/CartLine/')))return Response.json({error:'Please select a valid item and quantity.'},{status:400,headers});
 if(action==='buy'){const result=await changeCart(context.get(environmentContext),null,{action:'add',quantity,variant},request.signal,context.get(storefrontContext).requestContext);return Response.json({checkoutUrl:result.cart.checkoutUrl},{headers});}
 const saved=await cartCookie.parse(request.headers.get('Cookie'));let id=typeof saved==='string'?saved:null;
 if(id&&action==='add'&&!await readCart(context.get(environmentContext),id,request.signal,context.get(storefrontContext).requestContext))id=null;
 const result=await changeCart(context.get(environmentContext),id,{action,quantity,variant,line,codes:code?[code]:[]},request.signal,context.get(storefrontContext).requestContext);
 return Response.json(result,{headers:{...headers,'Set-Cookie':await cartCookie.serialize(result.cart.id,{secure:new URL(request.url).protocol==='https:'})}});
 }catch(error){return Response.json({error:error instanceof Response?await error.text():'Your bag could not be updated. Please try again.'},{status:error instanceof Response?error.status:503,headers});}
}
