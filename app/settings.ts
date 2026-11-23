import navigation from './content/navigation.json';

export type MenuLink = {title: string; href: string};
export type MenuGroup = MenuLink & {key?:string;children: MenuLink[]};

// Read-only snapshot; no live Shopify menu records have been changed.
export const settings = {
  brand: 'EQUATOR',
  logo: '/images/equator-wordmark-2026.png',
  colors: {background: '#ffffff', text: '#111111', muted: '#777777', border: '#d6d6d6'},
  typography: {navigation: '"Helvetica Neue", Helvetica, Arial, sans-serif', body: '"Helvetica Neue", Helvetica, Arial, sans-serif', heading: '"Helvetica Neue", Helvetica, Arial, sans-serif'},
  motion: {duration: 350, easing: 'cubic-bezier(0.33, 1, 0.68, 1)'},
  header: {height: 80, transparent: true, primaryMenuCount:6},
  newsletter: {heading: 'Join Our Newsletter', placeholder: 'Your email address', description: 'Promotions, new products, and sales, directly to your inbox.'},
  contact: {email: 'customer@equatorstores.com', phone:'+924235454780', phoneLabel:'042-35454780', mobiles:[{number:'+923351623167',label:'+92-335-1623167'},{number:'+923334919028',label:'+92-333-4919028'}], address:'23 KM, Ferozepur Road, Gajjumatta, Lahore.', whatsapp:'https://wa.me/923334919028'},
  storeLocation: {heading: 'Store Locations', href: '/pages/store-locations', mapUrl: 'https://www.google.com/maps?q=Equator%20Mall%2096%20MM%20Alam%20Road%20Lahore&output=embed', caption: 'Explore our stores across Pakistan'},
  footerShop: [
    {title: 'New Arrivals', href: '/collections/new-arrivals'},
    {title: 'Season End Sale', href: '/collections/summer-sale'},
    {title: 'Polos', href: '/collections/polos'},
    {title: 'T-Shirts', href: '/collections/t-shirts'},
    {title: 'Casual Shirts', href: '/collections/woven-shirts'},
    {title: 'Bottoms', href: '/collections/fashion-pants'},
    {title: 'Sweaters', href: '/collections/wwsweaters'},
    {title: 'Jackets', href: '/collections/jackets-1'},
    {title: 'Blazers', href: '/collections/blazers'},
    {title: 'Suits', href: '/collections/suits'},
    {title: 'Active Wear', href: '/collections/active-wear'},
    {title: 'Accessories', href: '/collections/accessories'},
    {title: 'Qaftaan', href: '/collections/qaftaan'},
    {title: 'Winter Sale', href: '/collections/winter-sale'},
  ] satisfies MenuLink[],
  region: 'Pakistan (PKR Rs)',
  menu: navigation.header satisfies MenuGroup[],
  collectionGroups: navigation.collectionGroups satisfies MenuGroup[],
  footer: navigation.footer satisfies MenuLink[],
  socials: navigation.socials satisfies MenuLink[],
};
