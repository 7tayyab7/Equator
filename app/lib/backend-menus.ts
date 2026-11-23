import type {MenuGroup} from '../settings';
export type BackendMenuItem={id?:string;title:string;url:string|null;items?:BackendMenuItem[]};
export type BackendMenu={handle:string;title:string;items:BackendMenuItem[]};
const mainKeys:Record<string,string>={'670384619764':'New In','670384652532':'Winter ’26','670384685300':'Casual','670384718068':'Formal','670384750836':'Clearance','670384783604':'Accessories'};
const seasonKeys:Record<string,string>={'670385996020':'Summer Sale','670386028788':'Winter Sale'};
const sources:Record<string,string>={'Winter ’26':'winter','Casual':'casual','Formal':'formals'};
export function menuHref(value:string):string|null {
 try{const url=new URL(value,'https://equatorstores.com');if(!['https:','http:'].includes(url.protocol))return null;
  if(['equatorstores.com','www.equatorstores.com','checkout.equatorstores.com','equatorstores.myshopify.com'].includes(url.hostname)){
   if(url.pathname==='/collections/clearance-sale')url.pathname='/collections/clearance';
   return url.pathname+url.search+url.hash;
  }return url.href;
 }catch{return null;}
}
export function applySeasonalMenus(base:MenuGroup[],data:Record<string,BackendMenu|null>):MenuGroup[]{
 const clearance=data.main?.items.find(item=>mainKeys[item.id?.split('/').pop()||'']==='Clearance');
 return (clearance?clearance.items||[]:base).flatMap(item=>{
  const key='href' in item?item.title:seasonKeys[item.id?.split('/').pop()||'']||item.title;
  const original=base.find(group=>group.title===key),href='href' in item?item.href:typeof item.url==='string'?menuHref(item.url):null;
  if(!href)return [];
  const source=key==='Summer Sale'?data.summerSale:key==='Winter Sale'?data.winterSale:null;
  return [{...('href' in item?item:{title:item.title,key,href}),children:source?menuItems(source.items):'href' in item?item.children:menuItems(item.items||original?.children.map(link=>({title:link.title,url:link.href}))||[])}];
 });
}
function menuItems(items:BackendMenuItem[]){return items.flatMap(item=>{const href=typeof item.url==='string'?menuHref(item.url):null;return href&&item.title.trim()?[{title:item.title,href}]:[];});}
export function applyStorefrontMainMenu(base:MenuGroup[],data:Record<string,BackendMenu|null>):MenuGroup[]{
 if(!data.main)return applyBackendMenus(base,data);
 return data.main.items.flatMap(item=>{
  const href=typeof item.url==='string'?menuHref(item.url):null;if(!href||!item.title.trim())return [];
  const key=mainKeys[item.id?.split('/').pop()||'']||base.find(group=>group.href===href)?.title||item.title;
  const source=data[sources[key]];
  return [{title:item.title,key,href,children:source?menuItems(source.items):menuItems(item.items||[])}];
 });
}
export function applyBackendMenus(base:MenuGroup[],data:Record<string,BackendMenu|null>):MenuGroup[]{
 return base.map(group=>{
  const menu=data[sources[group.title]];let children=menu&&Array.isArray(menu.items)?menu.items.flatMap(item=>{
   const href=typeof item.url==='string'?menuHref(item.url):null;return href&&typeof item.title==='string'&&item.title.trim()?[{title:item.title,href}]:[];
  }):group.children;
  return {...group,href:group.title==='Clearance'?'/collections/clearance':group.href,children};
 });
}
