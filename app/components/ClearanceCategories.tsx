import {Link} from 'react-router';
import {collectionHref} from '../lib/collection-navigation';
import type {MenuGroup} from '../settings';
/** The same seasonal collections power the mega menu and navigation drawer. */
export function ClearanceCategories({groups,onNavigate}:{groups:MenuGroup[];onNavigate?:()=>void}){
 return <div className="clearance-season-grid">{groups.map(group=><section className="clearance-season" key={group.href} aria-label={`${group.title} categories`}>
  <h3><Link className="nav-type clearance-season-title" to={collectionHref(group.href,group.title)} onClick={onNavigate}>{group.title.replace(/ Sale$/,'')}</Link></h3>
  <div>{group.children.map(link=><Link className="nav-type" key={link.href} to={collectionHref(link.href,group.title)} onClick={onNavigate}>{link.title.replaceAll('/',' / ')}</Link>)}</div>
 </section>)}</div>;
}
