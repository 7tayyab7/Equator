import {activeTrackingConsent,hasConsentChoice,consentBannerNeeded,readTrackingConsent,saveTrackingConsent} from '../lib/tracking.client';
import {fitMenuIndices} from '../lib/navigation-fit';
import {ClearanceCategories} from './ClearanceCategories';
import {ArrowIcon} from './ArrowIcon';
import {collectionHref} from '../lib/collection-navigation';
import {StoreWordmark} from './StoreWordmark';
import {WishlistContents} from './WishlistContents';
import {useWishlist} from './WishlistProvider';
import {useEffect, useRef, useState, type ReactNode, type FormEvent} from 'react';
import {Link, useLocation, useNavigate, useNavigation} from 'react-router';
import type {settings as defaultSettings,MenuGroup} from '../settings';
import {useCart, BagContents} from './CartProvider';
import {Icon} from './Icon';
import {Footer,SocialIcon} from './Footer';
import {MenuFeatures} from './MenuFeatures';
import {WhatsAppSupport} from './WhatsAppSupport';

type Settings = Omit<typeof defaultSettings,'menu'|'collectionGroups'>&{menu:MenuGroup[];collectionGroups:MenuGroup[]};
type Panel = 'menu' | 'search' | 'bag' | 'wishlist' | 'social' | 'region' | 'cookies' | null;

function Arrow() {return <ArrowIcon/>;}
function CloseIcon() {return <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true"><path d="m3 3 12 12M15 3 3 15" stroke="currentColor" strokeWidth="1"/></svg>;}

export function StoreLayout({settings, children,hostedStoreOrigin}: {settings: Settings; children: ReactNode;hostedStoreOrigin:string}) {
  const {pathname} = useLocation();
  const transition=useNavigation();
  const {cart,bagRequest} = useCart();
  const {items:wishlistItems} = useWishlist();
  const wishlistCount = wishlistItems.length;
  const wishlistLabel = `Wishlist, ${wishlistCount} ${wishlistCount===1?'item':'items'}`;
  const navigate = useNavigate();
  const [active, setActive] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [mobileGroup, setMobileGroup] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [sharing,setSharing]=useState(false),[consentNeeded,setConsentNeeded]=useState(false),[savingConsent,setSavingConsent]=useState(false);
  useEffect(()=>{const update=()=>{const saved=hasConsentChoice()?readTrackingConsent():activeTrackingConsent();setAnalytics(saved.analytics);setMarketing(saved.marketing);setSharing(saved.sharing);setConsentNeeded(consentBannerNeeded());};update();document.addEventListener('equator:consent-ready',update);document.addEventListener('equator:consent-changed',update);return()=>{document.removeEventListener('equator:consent-ready',update);document.removeEventListener('equator:consent-changed',update);};},[]);
  const [cookieMessage, setCookieMessage] = useState('');
  const [visibleMenuIndices,setVisibleMenuIndices] = useState<number[]>(()=>Array.from({length:settings.header.primaryMenuCount},(_,index)=>index));
  const navigation = useRef<HTMLElement>(null);
  const measurements = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solid = scrolled || active !== null || panel !== null || pathname !== '/' || !settings.header.transparent;

  useEffect(() => {
    const onScroll = () => {
      const campaigns=document.querySelector('.campaign-banners');
      const headerHeight=document.querySelector('.header-chrome')?.getBoundingClientRect().height||settings.header.height;
      setScrolled(campaigns ? campaigns.getBoundingClientRect().bottom <= headerHeight : window.scrollY > 32);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname, settings.header.height]);

  useEffect(() => {
    function fitNavigation() {
      const available = navigation.current?.clientWidth || 0;
      const items = measurements.current?.querySelectorAll(':scope > span');
      if (!available || !items?.length) return;
      const gap=Number.parseFloat(getComputedStyle(navigation.current!).columnGap)||16;
      const more = items[settings.menu.length].getBoundingClientRect().width;
      const widths=Array.from(items).slice(0,settings.menu.length).map(item=>item.getBoundingClientRect().width);
      const next=fitMenuIndices(widths,more,available,gap,settings.menu.findIndex(group=>group.title==='Accessories'),settings.header.primaryMenuCount);
      setVisibleMenuIndices(current=>current.join(',')===next.join(',')?current:next);
    }
    const observer = new ResizeObserver(fitNavigation);
    if (navigation.current) observer.observe(navigation.current);
    fitNavigation();
    void document.fonts.ready.then(fitNavigation);
    return () => observer.disconnect();
  }, [settings.menu]);

  useEffect(() => {
    if (panel && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (panel === 'search') dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    else if (panel) dialog.current?.querySelector<HTMLButtonElement>('.close-panel')?.focus();
    if (!panel && dialog.current?.open) dialog.current.close();
    
  }, [panel]);

  useEffect(() => {if (bagRequest) setPanel('bag');}, [bagRequest]);
  useEffect(() => {setActive(null); setPanel(null); setMobileGroup(null);}, [pathname]);
  useEffect(()=>{if(transition.state!=="idle"){setActive(null);setPanel(null);setMobileGroup(null);}},[transition.state]);
  useEffect(() => {
    return () => {if (leaveTimer.current) clearTimeout(leaveTimer.current);};
  }, []);

  function openPanel(next: Panel) {setActive(null); setPanel(next);}
  function enterGroup(index: number) {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setActive(index);
  }
  function leaveHeader() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setActive(null), 140);
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get('q') || '').trim();
    if (query) {setPanel(null); navigate(`/search?q=${encodeURIComponent(query)}`);}
  }
  async function saveCookies(value={analytics,marketing,sharing}) {
    setSavingConsent(true);setCookieMessage('');
    try{await saveTrackingConsent(value);setAnalytics(value.analytics);setMarketing(value.marketing);setSharing(value.sharing);setConsentNeeded(false);setPanel(null);}
    catch(error){setCookieMessage(error instanceof Error?error.message:'Preferences could not be saved. Please try again.');}
    finally{setSavingConsent(false);}
  }

  return <div className="store-layout" data-announcement="hidden" data-homepage={pathname === '/' || undefined} data-reduced-motion={reducedMotion || undefined}>
    {consentNeeded&&<section className="cookie-notice" aria-label="Cookie choices"><p>We use cookies to improve your experience and, with your permission, measure visits and personalise advertising. <Link to="/pages/privacy-policy">Privacy policy</Link></p><div><button disabled={savingConsent} onClick={()=>void saveCookies({analytics:false,marketing:false,sharing:false})}>Essential only</button><button disabled={savingConsent} onClick={()=>openPanel('cookies')}>Preferences</button><button disabled={savingConsent} onClick={()=>void saveCookies({analytics:true,marketing:true,sharing:true})}>Accept all</button></div>{cookieMessage&&<p role="alert">{cookieMessage}</p>}</section>}
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className={`store-header ${solid ? 'is-solid' : 'is-transparent'}`} onClickCapture={event=>{if((event.target as Element).closest('a[href]')){setActive(null);setPanel(null);}}} onMouseLeave={leaveHeader}
      onMouseEnter={() => {if (leaveTimer.current) clearTimeout(leaveTimer.current);}}
      onKeyDown={event => {if (event.key === 'Escape') {event.currentTarget.querySelector<HTMLButtonElement>(`[aria-controls="menu-${active}"]`)?.focus(); setActive(null);}}}
      onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null);}}>
      <div className="header-chrome">
      <div className="header-bar">
        <div className="mobile-header-actions"><button className="mobile-menu-trigger icon-button" onClick={() => openPanel('menu')} aria-label="Open menu" aria-haspopup="dialog"><Icon name="menu"/></button><button className="icon-button wishlist-trigger" onClick={()=>openPanel('wishlist')} aria-label={wishlistLabel} aria-haspopup="dialog"><Icon name="heart" selected={wishlistCount>0}/>{wishlistCount>0&&<span className="bag-count" aria-hidden="true">{wishlistCount}</span>}</button></div>
        <nav ref={navigation} className="desktop-navigation" aria-label="Main navigation">
          {settings.menu.map((group,index)=>({group,index})).filter(({index})=>visibleMenuIndices.includes(index)).map(({group,index}) => group.children.length ? <button key={group.title} className={`nav-type nav-link ${active === index ? 'is-active' : ''}`}
            onMouseEnter={() => enterGroup(index)} onKeyDown={event => {if (event.key === 'ArrowDown') {event.preventDefault(); enterGroup(index);}}}
            onClick={() => group.href.startsWith('/collections/')?navigate(collectionHref(group.href,group.title)):enterGroup(index)} aria-expanded={active === index} aria-controls={`menu-${index}`}>{group.title}</button>
            : <Link key={group.title} className="nav-type nav-link" onMouseEnter={() => setActive(null)} to={group.href}>{group.title}</Link>)}
          <button className="nav-type nav-link nav-more" onMouseEnter={() => setActive(null)} onClick={() => openPanel('menu')} aria-label="More navigation" aria-haspopup="dialog" aria-expanded={panel === 'menu'}>More <span aria-hidden="true">+</span></button>
        </nav>
        <div className="navigation-measurement" ref={measurements} aria-hidden="true">{settings.menu.map(group => <span className="nav-type" key={group.title}>{group.title}</span>)}<span className="nav-type nav-more">More <b aria-hidden="true">+</b></span></div>
        <Link className="brand" to="/" aria-label="Equator home" onMouseEnter={() => setActive(null)}>
          <StoreWordmark/>
        </Link>
        <nav className="header-utilities" aria-label="Shopping tools" onMouseEnter={() => setActive(null)}>
          <button className="icon-button" aria-label="Search" onClick={() => openPanel('search')} aria-haspopup="dialog"><Icon name="search"/></button>
          <button className="icon-button utility-secondary wishlist-trigger" aria-label={wishlistLabel} onClick={() => openPanel('wishlist')} aria-haspopup="dialog"><Icon name="heart" selected={wishlistCount>0}/>{wishlistCount>0&&<span className="bag-count" aria-hidden="true">{wishlistCount}</span>}</button>

          <button className="icon-button bag-trigger" onClick={() => openPanel('bag')} aria-label={`Bag, ${cart?.totalQuantity || 0} ${cart?.totalQuantity===1?'item':'items'}`} aria-haspopup="dialog"><Icon name="bag"/>{!!cart?.totalQuantity&&<span className="bag-count" aria-hidden="true">{cart.totalQuantity}</span>}</button>
        </nav>
      </div>
      </div>
      {settings.menu.map((group, index) => <div key={group.title} id={`menu-${index}`} className="desktop-dropdown" hidden={active !== index}>
        <nav aria-label={`${group.title} categories`} className="dropdown-links">
          {(group.key||group.title)==='Clearance'?<ClearanceCategories groups={settings.collectionGroups}/>:group.children.map(link => <Link className="nav-type" key={link.href} to={collectionHref(link.href,group.title)}>{link.title}</Link>)}
          {group.href !== '#' && <Link className="nav-type view-all" to={collectionHref(group.href,group.title)}>Explore {group.title} <Arrow/></Link>}
        </nav>
        {active===index&&<MenuFeatures title={group.title}/>}
      </div>)}
    </header>
    {active !== null && <button className="navigation-backdrop" tabIndex={-1} aria-label="Close navigation" onClick={() => setActive(null)}/>}
    <main id="main-content" tabIndex={-1}>{children}</main>
    <Footer hostedStoreOrigin={hostedStoreOrigin} settings={settings} onCookies={()=>openPanel('cookies')}/>
    <WhatsAppSupport href={settings.contact.whatsapp}/>
    <p className="sr-only" role="status">{cookieMessage}</p>
    <dialog ref={dialog} className={`store-dialog panel-${panel ?? 'closed'}`} aria-labelledby="panel-title" onClickCapture={event=>{if((event.target as Element).closest("a[href]"))setPanel(null);}}
      onCancel={() => setPanel(null)} onClose={() => setPanel(null)}
      onClick={event => {if (event.target === event.currentTarget) {
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setPanel(null);
      }}}>
      <button className="close-panel" aria-label="Close panel" onClick={() => setPanel(null)}><CloseIcon/></button>
      {panel === 'menu' && <>
        <h2 id="panel-title" className="sr-only">Menu</h2>
        <Link className="drawer-wordmark" to="/" onClick={()=>setPanel(null)} aria-label="Equator home"><StoreWordmark/></Link>
        <nav aria-label="Mobile navigation" className="mobile-navigation">
          {settings.menu.map((group, index) => <div className="mobile-group" key={group.title}>
            {group.children.length ? <div className="drawer-group-heading">
              {group.href.startsWith('/collections/')?<Link className="nav-type" to={collectionHref(group.href,group.title)} onClick={()=>setPanel(null)}>{group.title}</Link>:<button className="nav-type" onClick={()=>setMobileGroup(mobileGroup===index?null:index)} aria-expanded={mobileGroup===index}>{group.title}</button>}
              <button className="drawer-category-toggle" aria-label={`${mobileGroup===index?'Hide':'Show'} ${group.title} categories`} aria-expanded={mobileGroup===index} aria-controls={`mobile-menu-${index}`} onClick={()=>setMobileGroup(mobileGroup===index?null:index)}><ArrowIcon direction={mobileGroup===index?'down':'right'} chevron/></button>
            </div>:<Link className="nav-type mobile-leaf" to={group.href} onClick={()=>setPanel(null)}>{group.title}</Link>}
            <div id={`mobile-menu-${index}`} className="mobile-submenu" hidden={mobileGroup !== index}>
              {(group.key||group.title)==='Clearance'?<ClearanceCategories groups={settings.collectionGroups} onNavigate={()=>setPanel(null)}/>:group.children.map(link => <Link key={link.href} className="nav-type" to={collectionHref(link.href,group.title)} onClick={()=>setPanel(null)}>{link.title}</Link>)}
              {group.href !== '#' && <Link className="nav-type" to={collectionHref(group.href,group.title)}>View all {group.title}</Link>}
              {mobileGroup===index&&<MenuFeatures title={group.title}/>}
            </div>
          </div>)}
          <div className="drawer-support-links">
            <button className="drawer-wishlist" onClick={()=>openPanel('wishlist')}><Icon name="heart" selected={wishlistCount>0}/><span><strong>Wishlist</strong><small>View &amp; manage your saved items</small></span><ArrowIcon chevron/></button>
            <Link className="drawer-contact-link" to="/pages/contact" onClick={()=>setPanel(null)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M4 13V10a8 8 0 0 1 16 0v3M5 12H3v7h3v-7Zm14 0h2v7h-3v-7ZM19 19c0 2-2 3-5 3"/></svg><span>Contact Us</span><ArrowIcon chevron/></Link>
          </div>
          <div className="mobile-menu-footer">

            <div className="mobile-menu-socials" role="group" aria-label="Follow Equator">{settings.socials.map(link=><a key={link.href} href={link.href} aria-label={link.title} target="_blank" rel="noopener noreferrer"><SocialIcon name={link.title}/></a>)}</div>
          </div>
        </nav>
      </>}
      {panel === 'search' && <>
        <h2 id="panel-title" className="sr-only">Search Equator</h2>
        <form className="search-form" onSubmit={search}>
          <label htmlFor="search-keyword" className="sr-only">Enter keyword</label>
          <input id="search-keyword" className="nav-type" placeholder="Enter keyword" type="search" name="q" required autoFocus/>
          <button type="submit" aria-label="Submit search"><Arrow/></button>
        </form>
      </>}
      {panel === 'bag' && <>
        <h2 id="panel-title" className="nav-type panel-title">Your Bag ({cart?.totalQuantity || 0})</h2>
        <BagContents close={() => setPanel(null)}/><Link className="bag-page-link" to="/cart" onClick={()=>setPanel(null)}>View full bag <ArrowIcon/></Link>
      </>}
      {panel === 'wishlist' && <>
        <h2 id="panel-title" className="nav-type panel-title">Your Wishlist</h2>
        <WishlistContents/>
      </>}
      {panel === 'social' && <>
        <h2 id="panel-title" className="nav-type panel-title">Follow Equator</h2>
        <nav className="social-links" aria-label="Equator social profiles">{settings.socials.map(link => <a className="nav-type" href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">{link.title}<Arrow/></a>)}</nav>
      </>}
      {panel === 'region' && <>
        <h2 id="panel-title" className="nav-type panel-title">Region & Currency</h2>
        <p className="region-current">{settings.region}</p>
        <p className="panel-note">Other regions will appear after Shopify Markets is connected.</p>
      </>}
      {panel === 'cookies' && <>
        <h2 id="panel-title" className="nav-type panel-title">Cookie Preferences</h2>
        <p className="panel-note">Choose whether we can measure visits and personalise advertising. You can change these preferences at any time.</p>
        <label className="consent-option">Essential <input type="checkbox" checked disabled/></label>
        <label className="consent-option">Analytics <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/></label>
        <label className="consent-option">Marketing <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/></label>
        <label className="consent-option">Advertising data sharing <input type="checkbox" checked={sharing} onChange={e=>setSharing(e.target.checked)}/></label><p className="panel-note">Advertising tags require Marketing and Advertising data sharing. Browser privacy opt-outs are respected.</p><button disabled={savingConsent} className="solid-button nav-type" onClick={()=>void saveCookies()}>Save preferences</button>{cookieMessage&&<p role="alert">{cookieMessage}</p>}
      </>}
    </dialog>
  </div>;
}

