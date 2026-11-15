/** Bridge older Oxygen Headers to the SDK's standard cookie API without comma-splitting cookies. */
export function ensureCookieHeaderAPI(ctor:typeof Headers=Headers){
 const proto=ctor.prototype as Headers&{getAll?:(name:string)=>string[]};
 if(typeof proto.getSetCookie==='function')return;
 if(typeof proto.getAll!=='function')throw new Error('This runtime cannot preserve separate Set-Cookie headers');
 Object.defineProperty(proto,'getSetCookie',{configurable:true,writable:true,value:function(this:Headers&{getAll:(name:string)=>string[]}){return this.getAll('Set-Cookie');}});
}
