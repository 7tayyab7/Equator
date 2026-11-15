import {Link} from 'react-router';

/** Static policy links: no carousel timer, layout shift or extra network request. */
export function TrustAnnouncement(){
 return <nav className="trust-announcement" aria-label="Delivery, returns and payment information">
  <Link to="/pages/shipping-policy" title="Processing: 1–2 business days. Delivery: 3–5 business days. Excludes weekends and holidays; see policy."><span className="trust-desktop">Delivery: 3–5 business days</span><span className="trust-mobile">Delivery: 3–5<br/>business days</span></Link>
  <Link to="/pages/return-exchange-policy" title="Returns and exchanges are subject to eligibility, time limits and sale exclusions. Read the full policy."><span className="trust-desktop">Returns & exchanges · Conditions apply</span><span className="trust-mobile">Returns & exchanges<br/>Conditions apply</span></Link>
  <Link to="/pages/contact" title="Cash on delivery is available across Pakistan. Contact Equator for assistance."><span className="trust-desktop">Cash on delivery across Pakistan</span><span className="trust-mobile">Cash on delivery<br/>Across Pakistan</span></Link>
 </nav>;
}
