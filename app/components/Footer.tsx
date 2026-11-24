import {ArrowIcon} from './ArrowIcon';
import {PaymentMethods} from './PaymentMethods';
import {StoreWordmark} from './StoreWordmark';
import {useEffect, useState, type ReactNode} from 'react';
import {Link} from 'react-router';
import type {settings as defaultSettings} from '../settings';

/** Google Maps is heavy: on phones it loads only once Store Locations is opened (desktop always shows it). */
function StoreMap({src, expanded}: {src: string; expanded: boolean}) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {const query = window.matchMedia('(min-width:851px)'), update = () => setDesktop(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update);}, []);
  return expanded || desktop ? <iframe title="Equator store location — MM Alam Road, Lahore" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/> : <div className="footer-map-placeholder" aria-hidden="true"/>;
}
function FooterGroup({id, title, children, className = ''}: {id: string; title: string; children: ReactNode | ((expanded: boolean) => ReactNode); className?: string}) {
  const [expanded, setExpanded] = useState(false);
  return <section className={`footer-group ${className} ${expanded ? 'is-expanded' : ''}`}>
    <h2 className="footer-desktop-heading footer-heading">{title}</h2>
    <h2 className="footer-mobile-heading"><button aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>{title}<span className="accordion-plus" aria-hidden="true"/></button></h2>
    <div id={id} className="footer-group-panel"><div className="footer-group-content">{typeof children === 'function' ? children(expanded) : children}</div></div>
  </section>;
}

export function SocialIcon({name}: {name: string}) {
  const platform = name.replace('Follow on ', '').toLowerCase();
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {platform === 'facebook' && <path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5c-.6-.1-1.7-.2-3-.2-3 0-5 1.8-5 5V9H7v4h3v9z"/>}
    {platform === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.5" cy="6.5" r="1"/></>}
    {platform === 'youtube' && <><path d="M22 7a3 3 0 0 0-2-2c-2-.5-14-.5-16 0a3 3 0 0 0-2 2c-.5 2-.5 8 0 10a3 3 0 0 0 2 2c2 .5 14 .5 16 0a3 3 0 0 0 2-2c.5-2 .5-8 0-10z"/><path d="m10 8 6 4-6 4z" fill="var(--color-paper)"/></>}
    {platform === 'tiktok' && <path d="M14 2h3c.3 2.3 1.6 3.8 4 4.1v3a8 8 0 0 1-4-1.2V16a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z"/>}
    {platform === 'x' && <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l4.4 6.7L18.9 2Zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20Z"/>}
  </svg>;
}

const STORE_LOCATOR={title:'Store Locator',href:'/pages/store-locations'};

export function Footer({settings,onCookies,hostedStoreOrigin}: {settings: typeof defaultSettings;onCookies:()=>void;hostedStoreOrigin:string}) {
  const orderLinks = settings.footer.filter(link => !['Contact Us', 'Store Locations', 'Our Blog'].includes(link.title));
  // Store Locator closes the Information column (the map card on the right links to the same page).
  const informationLinks = [...orderLinks.filter(link => link.href !== STORE_LOCATOR.href), STORE_LOCATOR];
  return <footer id="site-footer" className="store-footer">
    <div className="footer-main">
      <div className="footer-featured">
        <section className="footer-newsletter" aria-labelledby="newsletter-heading">
          <h2 id="newsletter-heading" className="footer-heading">{settings.newsletter.heading}</h2>
          <p>{settings.newsletter.description}</p>
          <form method="post" action={`${hostedStoreOrigin}/contact#contact_form`} className="footer-newsletter-form"><input type="hidden" name="form_type" value="customer"/><input type="hidden" name="utf8" value="✓"/><input type="hidden" name="contact[tags]" value="newsletter"/>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" name="contact[email]" type="email" placeholder={settings.newsletter.placeholder} autoComplete="email" required/>
            <button type="submit">Subscribe</button>
          </form>
          <p className="newsletter-consent">By subscribing, you agree to receive Equator news and offers. <Link to="/pages/privacy-policy">Privacy policy</Link></p>
        </section>
        <FooterGroup id="footer-store-locations" title={settings.storeLocation.heading} className="footer-location">
          {expanded => <>
          <StoreMap src={settings.storeLocation.mapUrl} expanded={expanded}/>
          <Link className="store-location-link" to={settings.storeLocation.href}>{settings.storeLocation.caption}<span aria-hidden="true"><ArrowIcon direction="up-right"/></span></Link>
          </>}
        </FooterGroup>
      </div>
      <FooterGroup id="footer-shop" title="Shop Equator" className="footer-shop">
        <nav className="footer-shop-links" aria-label="Shop Equator">{settings.footerShop.map(link => <Link key={link.href} to={link.href}>{link.title}</Link>)}</nav>
      </FooterGroup>
      <div className="footer-information">
        <FooterGroup id="footer-order-information" title="Information">
          <nav className="footer-list" aria-label="Information">{informationLinks.map(link => <Link key={link.href} to={link.href}>{link.title}</Link>)}</nav>
        </FooterGroup>
        <FooterGroup id="footer-customer-service" title="Customer Service">
          <nav className="footer-service-links" aria-label="Customer Service"><a href={`mailto:${settings.contact.email}`}>Email</a><Link to="/pages/contact">Contact Us</Link><Link to="/blogs/news">Our Blog</Link></nav>
        </FooterGroup>
      </div>
    </div>
    <div className="footer-payment-strip"><nav className="footer-socials footer-desktop-socials" aria-label="Equator social profiles">{settings.socials.map(link => <a href={link.href} key={link.href} aria-label={link.title} target="_blank" rel="noopener noreferrer"><SocialIcon name={link.title}/></a>)}</nav><PaymentMethods/></div>
    <div className="footer-mobile-social-row">
      <nav className="footer-socials" aria-label="Equator mobile social profiles">{settings.socials.map(link=><a key={link.href} href={link.href} aria-label={link.title} target="_blank" rel="noopener noreferrer"><SocialIcon name={link.title}/></a>)}</nav>

    </div>
    <div className="footer-bottom">
      <Link className="footer-wordmark" to="/" aria-label="Equator home"><StoreWordmark/></Link>
      <p className="footer-copyright">© 2026 Equator</p>
    </div>
    <div className="footer-cookie-controls"><button type="button" onClick={onCookies}>Cookie preferences</button></div>
  </footer>;
}
