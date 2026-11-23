import {useStoreMenu} from './StoreNavigationProvider';
import {ArrowIcon} from './ArrowIcon';
import {collectionHref} from '../lib/collection-navigation';
import {responsiveImage} from '../lib/images';
import {Link} from 'react-router';
import features from '../content/menu-features.json';

export function MenuFeatures({title}: {title:string}) {
  const group=useStoreMenu().find(group=>group.title===title);
  const featureKey=group?.key||title;
  const cards=features[featureKey as keyof typeof features]?.flatMap(card=>{
    const match='menuItemTitle' in card?group?.children.find(link=>link.title.toLowerCase()===String(card.menuItemTitle).toLowerCase()):null;
    return 'menuItemTitle' in card&&!match?[]:[{...card,href:match?.href||card.href}];
  });
  if(!cards)return null;
  return <div className="menu-features" aria-label={`${title} highlights`}>
    {cards.map(card=><Link className="menu-feature" to={collectionHref(card.href,title)} key={card.href}>
      <span className="menu-feature-image"><img {...responsiveImage(card.image,440,[220,320,440,640],'(max-width:850px) 36vw, 16vw')} alt={card.alt} width="600" height="800" loading="lazy" decoding="async" sizes="(max-width:850px) 36vw, 16vw"/></span>
      <span className="nav-type menu-feature-title">{card.title}<span aria-hidden="true"><ArrowIcon direction="up-right"/></span></span>
    </Link>)}
  </div>;
}
