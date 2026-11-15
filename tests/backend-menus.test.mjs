import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBackendMenus,applySeasonalMenus,applyStorefrontMainMenu,menuHref} from '../app/lib/backend-menus.ts';
import storefront from './fixtures/storefront-main-menu-nov2.json' with {type:'json'};
import navigation from '../app/content/navigation.json' with {type:'json'};
import snapshot from './fixtures/backend-menus-oct29.json' with {type:'json'};
const base=navigation.header;
test('main menu reads names, links, order, additions and removals from Shopify',()=>{
 const main=structuredClone(storefront.data.main),winter=main.items[1];
 winter.title='Winter edit';winter.url='https://checkout.equatorstores.com/collections/new-winter';
 main.items=[winter,...main.items.filter(item=>item.title!=='Winter edit'&&item.title!=='New In'),{title:'Journal',url:'/blogs/news',items:[]}];
 const groups=applyStorefrontMainMenu(base,{...snapshot.data,main});
 assert.equal(groups[0].title,'Winter edit');assert.equal(groups[0].href,'/collections/new-winter');assert.equal(groups[0].key,'Winter ’26');
 assert.ok(groups[0].children.length>0);assert.equal(groups.some(group=>group.title==='New In'),false);
 assert.equal(groups.at(-1).href,'/blogs/news');
 assert.deepEqual(groups.find(group=>group.key==='Accessories').children.map(link=>link.title),['Caps','Belt','Socks']);
 assert.deepEqual(applyStorefrontMainMenu(base,{main:{...main,items:[]}}),[]);
});
test('Clearance parent links and Summer New categories come from their editable menus',()=>{
 const main=structuredClone(storefront.data.main),clearance=main.items.find(item=>item.title==='Clearance');
 clearance.title='Sale';clearance.items[0].title='Summer edit';clearance.items[0].url='/collections/summer-edit';
 const summerSale={handle:'summer-new',title:'Summer New',items:[{title:'Active Wear',url:'https://checkout.equatorstores.com/collections/active-wear'}]};
 const groups=applySeasonalMenus(navigation.collectionGroups,{main,summerSale});
 assert.equal(groups[0].title,'Summer edit');assert.equal(groups[0].href,'/collections/summer-edit');
 assert.deepEqual(groups[0].children,[{title:'Active Wear',href:'/collections/active-wear'}]);
 assert.equal(groups[1].href,'/collections/winter-sale');
});
test('Clearance Winter follows the separate backend sale menu and keeps checkout links in Hydrogen',()=>{
 const winterSale={handle:'winter-sale-2020',title:'WINTER SALE',items:[{title:'JACKETS',url:'https://checkout.equatorstores.com/collections/winter-jackets-for-men'},{title:'SWEATERS',url:'https://checkout.equatorstores.com/collections/sweaters-for-men'}]};
 const groups=applySeasonalMenus(navigation.collectionGroups,{winterSale});
 assert.deepEqual(groups.find(group=>group.title==='Winter Sale').children,[{title:'JACKETS',href:'/collections/winter-jackets-for-men'},{title:'SWEATERS',href:'/collections/sweaters-for-men'}]);
 assert.deepEqual(groups.find(group=>group.title==='Summer Sale'),navigation.collectionGroups.find(group=>group.title==='Summer Sale'));
 assert.deepEqual(applySeasonalMenus(navigation.collectionGroups,{winterSale:null}),navigation.collectionGroups);
 assert.deepEqual(applySeasonalMenus(navigation.collectionGroups,{winterSale:{...winterSale,items:[]}}).find(group=>group.title==='Winter Sale').children,[]);
});
test('backend menus preserve their items and order without injecting Winter Blazers',()=>{
 const groups=applyBackendMenus(base,snapshot.data);
 for(const [title,key] of [['Winter ’26','winter'],['Casual','casual'],['Formal','formals']]){
  const children=groups.find(g=>g.title===title).children;
  const original=snapshot.data[key].items.map(item=>({title:item.title,href:item.url.replace('https://equatorstores.com','')}));
  assert.deepEqual(children,original);
 }
 assert.equal(groups.find(g=>g.title==='Winter ’26').children[0].href,'/collections/new-winter-jackets');
 assert.equal(groups.find(g=>g.title==='Formal').children.length,6);
 assert.equal(groups.find(g=>g.title==='Clearance').href,'/collections/clearance');
});
test('missing menu falls back per group; an intentionally empty backend menu stays empty',()=>{
 const result=applyBackendMenus(base,{casual:{handle:'casual',title:'CASUAL',items:[]},winter:null});
 assert.deepEqual(result.find(g=>g.title==='Casual').children,[]);
 assert.deepEqual(result.find(g=>g.title==='Winter ’26').children,base.find(g=>g.title==='Winter ’26').children);
 assert.ok(base.find(g=>g.title==='Casual').children.length>0);
});
test('store links stay in Hydrogen and invalid executable links are rejected',()=>{
 assert.equal(menuHref('https://equatorstores.com/collections/a?sort=x#top'),'/collections/a?sort=x#top');
 assert.equal(menuHref('https://equatorstores.myshopify.com/collections/a'),'/collections/a');
 assert.equal(menuHref('javascript:alert(1)'),null);
 assert.equal(menuHref('https://equatorstores.com/collections/clearance-sale'),'/collections/clearance');
 const groups=applyBackendMenus(base,{casual:{handle:'casual',title:'CASUAL',items:[{title:'Bad',url:'javascript:alert(1)'},{title:'No URL',url:null},{title:'Actual',url:'https://equatorstores.com/collections/actual'}]}});
 assert.deepEqual(groups.find(g=>g.title==='Casual').children,[{title:'Actual',href:'/collections/actual'}]);
});

test('merchant-provided backend links remain intact',()=>{const winter={handle:'winter-2026',title:'WINTER 2026',items:[{title:'Jackets',url:'https://equatorstores.com/collections/new-winter-jackets'},{title:'BLAZERS',url:'https://equatorstores.com/collections/blazers'}]};const children=applyBackendMenus(base,{winter}).find(group=>group.title==='Winter ’26').children;assert.deepEqual(children,[{title:'Jackets',href:'/collections/new-winter-jackets'},{title:'BLAZERS',href:'/collections/blazers'}]);});
