import {menuHref} from './backend-menus.ts';
export type NavigationGroup={title:string;href:string;children:{title:string;href:string}[]};
export const menuKey=(title:string)=>title.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function collectionHref(href:string,title:string){const localHref=menuHref(href)||'#';if(!localHref.startsWith('/collections/'))return localHref;const url=new URL(localHref,'https://preview.local');url.searchParams.set('menu',menuKey(title));return url.pathname+url.search+url.hash;}
export function collectionGroup(groups:NavigationGroup[],href:string,context:string|null){const matches=groups.filter(g=>g.children.length&&(g.href===href||g.children.some(c=>c.href===href)));return matches.find(g=>g.href===href)||matches.find(g=>menuKey(g.title)===context)||matches[0];}
