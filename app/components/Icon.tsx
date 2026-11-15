import {WishlistEmblem} from './WishlistEmblem';
export function Icon({name,selected=false}: {selected?:boolean;name: 'search' | 'heart' | 'account' | 'bag' | 'menu'}) {
  if(name==='heart')return <WishlistEmblem filled={selected}/>;
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'search' && <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>}
    {name === 'account' && <><circle cx="12" cy="7.5" r="3.5"/><path d="M5.5 20v-2.5a6.5 6.5 0 0 1 13 0V20Z"/></>}
    {name === 'bag' && <><path d="m6 8-1 13h14L18 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>}
    {name === 'menu' && <><path d="M4 7h16M4 12h16M4 17h16"/></>}
  </svg>;
}
