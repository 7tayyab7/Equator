import {imageSrcSet,shopifyImageURL} from '../lib/images';
import {useStoreMenu} from './StoreNavigationProvider';
import {collectionGroup,collectionHref} from '../lib/collection-navigation';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Link} from 'react-router';
import {useBannerSettings} from './BannerSettingsProvider';
import {CampaignWheelGesture} from '../lib/campaign-gesture';

export function CampaignBanners() {
  const menu=useStoreMenu();
  const {banners}=useBannerSettings();
  const root=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0),[warmed,setWarmed]=useState<number|null>(null);
  const navigate=useRef<(index:number)=>void>(()=>{});
  useEffect(()=>{
    // Cached hero images can finish before hydration attaches onLoad.
    const image=root.current?.querySelector<HTMLImageElement>('.campaign-banner[aria-hidden="false"] .campaign-image');
    if(image?.complete&&image.naturalWidth>0)setWarmed(active);
  },[active,banners]);
  useEffect(()=>{
    const element=root.current;
    if(!element)return;
    const stage=element;
    const sections=Array.from(stage.querySelectorAll<HTMLElement>('.campaign-banner'));
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,animationFrame=0;
    let targetIndex:number|null=null;
    const gesture=new CampaignWheelGesture();
    let touch:{x:number;y:number;delta:number;captured:boolean}|null=null;
    let previousHeight=stage.querySelector('.campaign-sticky')?.clientHeight||window.innerHeight;
    function paint() {
      const height=stage.querySelector('.campaign-sticky')?.clientHeight||window.innerHeight;
      const progress=Math.max(0,Math.min(banners.length-1,-stage.getBoundingClientRect().top/height));
      const index=targetIndex??Math.min(banners.length-1,Math.round(progress));
      setActive(current=>current===index?current:index);
      for(let i=0;i<sections.length;i++) {
        const offset=reduce.matches?(i<=index?0:height):Math.max(0,Math.min(height,(i-progress)*height));
        sections[i].style.transform=`translate3d(0,${offset}px,0)`;
        const image=sections[i].querySelector<HTMLElement>('.campaign-image');
        if(image)image.style.transform=banners[i].parallax&&!reduce.matches?`translate3d(0,${Math.max(-36,Math.min(36,(progress-i)*36))}px,0) scale(1.1)`:'none';
      }
    }
    function schedule(){if(!frame&&!animationFrame)frame=requestAnimationFrame(()=>{frame=0;paint();});}
    const height=()=>stage.querySelector('.campaign-sticky')?.clientHeight||window.innerHeight;
    const stageTop=()=>stage.getBoundingClientRect().top+window.scrollY;
    const indexAtScroll=()=>Math.max(0,Math.min(banners.length-1,Math.round((window.scrollY-stageTop())/height())));
    function isPinned() {
      const rect=stage.getBoundingClientRect();
      return rect.top<=2&&rect.bottom>=height()-2;
    }
    function isOverlay(target:EventTarget|null) {
      return !!document.querySelector('dialog[open]') || target instanceof Element&&!!target.closest('[role="dialog"],input,textarea,select,[contenteditable="true"],.menu-drawer');
    }
    function go(index:number,animate=true) {
      index=Math.max(0,Math.min(banners.length-1,index));
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(frame);frame=0;
      const destination=stageTop()+index*height(),start=window.scrollY;
      targetIndex=index;
      setActive(index);
      if(reduce.matches||!animate) {
        window.scrollTo({top:destination,behavior:'instant'});targetIndex=null;paint();return;
      }
      const started=performance.now();
      function step(now:number) {
        const t=Math.min(1,(now-started)/900);
        // Quintic easing gives a gentle start and finish without touchpad inertia skipping slides.
        const eased=t<.5?16*t**5:1-(-2*t+2)**5/2;
        window.scrollTo({top:start+(destination-start)*eased,behavior:'instant'});
        paint();
        if(t<1)animationFrame=requestAnimationFrame(step);
        else {animationFrame=0;targetIndex=null;paint();}
      }
      animationFrame=requestAnimationFrame(step);
    }
    // Distant navigation jumps directly rather than scrolling through unloaded images.
    navigate.current=index=>{gesture.reset();go(index,Math.abs(index-indexAtScroll())<=1);};
    function wheel(event:WheelEvent) {
      if(event.ctrlKey||isOverlay(event.target)||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!isPinned())return;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height():1);
      const index=indexAtScroll(),direction=Math.sign(delta);
      if(!direction)return;
      if(!animationFrame&&(index===0&&direction<0||index===banners.length-1&&direction>0)){gesture.reset();return;}
      event.preventDefault();
      if(gesture.accept(delta,performance.now(),!!animationFrame))go(index+direction);
    }
    function touchStart(event:TouchEvent) {
      touch=event.touches.length===1&&!isOverlay(event.target)&&isPinned()?{x:event.touches[0].clientX,y:event.touches[0].clientY,delta:0,captured:false}:null;
    }
    function touchMove(event:TouchEvent) {
      if(!touch||event.touches.length!==1)return;
      const delta=touch.y-event.touches[0].clientY,dx=touch.x-event.touches[0].clientX;
      if(Math.abs(dx)>Math.abs(delta)&&!touch.captured){touch=null;return;}
      const index=indexAtScroll(),direction=Math.sign(delta);
      if(!touch.captured&&!animationFrame&&(index===0&&direction<0||index===banners.length-1&&direction>0))return;
      if(Math.abs(delta)>8||touch.captured) {event.preventDefault();touch.captured=true;touch.delta=delta;}
    }
    function touchEnd() {
      if(touch?.captured&&Math.abs(touch.delta)>=35&&!animationFrame)go(indexAtScroll()+Math.sign(touch.delta));
      touch=null;
    }
    function cancelTouch(){touch=null;}
    function interrupt() {
      cancelAnimationFrame(animationFrame);animationFrame=0;targetIndex=null;gesture.reset();touch=null;
      schedule();
    }
    function keydown(event:KeyboardEvent) {
      if(['Tab','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))interrupt();
    }
    function resize() {
      const settled=targetIndex;interrupt();
      const height=stage?.querySelector('.campaign-sticky')?.clientHeight||window.innerHeight;
      const top=(stage?.getBoundingClientRect().top||0)+window.scrollY;
      const progress=settled??(window.scrollY-top)/previousHeight;
      if(progress>=0&&progress<=banners.length-1&&height!==previousHeight) window.scrollTo({top:top+progress*height,behavior:'instant'});
      previousHeight=height;schedule();
    }
    function measureLayout() {
      const sticky=stage.querySelector<HTMLElement>('.campaign-sticky');
      if(!sticky)return;
      const nav=stage.querySelector<HTMLElement>('.campaign-navigation');
      const navStyle=nav?getComputedStyle(nav):null;
      // Include the 28px entrance motion as well as a 20px visual gap.
      const reserved=nav&&nav.offsetHeight?nav.offsetHeight+Number.parseFloat(navStyle!.bottom)+48:48;
      sticky.style.setProperty('--campaign-nav-reserve',`${reserved}px`);
      for(const section of sections) {
        const content=section.querySelector<HTMLElement>('.campaign-content');
        const button=section.querySelector<HTMLElement>('.campaign-bottom-button');
        section.style.setProperty('--campaign-button-reserve',`${button?button.offsetHeight+20:0}px`);
        if(content)section.style.setProperty('--campaign-content-height',`${content.offsetHeight}px`);
      }
    }
    const layoutObserver=new ResizeObserver(measureLayout);
    for(const element of stage.querySelectorAll('.campaign-sticky,.campaign-navigation,.campaign-content,.campaign-bottom-button'))layoutObserver.observe(element);
    measureLayout();paint();
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize);reduce.addEventListener('change',schedule);
    window.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('touchstart',touchStart,{passive:true});window.addEventListener('touchmove',touchMove,{passive:false});
    window.addEventListener('touchend',touchEnd);window.addEventListener('touchcancel',cancelTouch);
    window.addEventListener('keydown',keydown);window.addEventListener('blur',interrupt);
    return()=>{layoutObserver.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('blur',interrupt);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);reduce.removeEventListener('change',schedule);cancelAnimationFrame(frame);cancelAnimationFrame(animationFrame);window.removeEventListener('wheel',wheel);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('touchend',touchEnd);window.removeEventListener('touchcancel',cancelTouch);};
  },[banners]);
  const current=banners[active]||banners[0];
  const title=(banner:typeof current)=>[banner.heading,banner.emphasis].filter(Boolean).join(' ').replace(/\s+/g,' ');
  return <div className="campaign-banners campaign-stage" ref={root} style={{'--slide-count':banners.length} as CSSProperties}>
    {banners.map((banner,index)=><div className="campaign-scroll-marker" id={`campaign-${banner.id}`} key={banner.id} style={{top:`${index*100}svh`}}/>)}
    <div className="campaign-sticky">
      {banners.map((banner,index)=>{
        const style={'--desktop-top':`${banner.desktopTop}%`,'--mobile-top':`${banner.mobileTop}%`,'--desktop-heading-width':`${banner.desktopHeadingMaxWidth}px`,'--mobile-heading-width':`${banner.mobileHeadingMaxWidth}px`,zIndex:index} as CSSProperties;
        const button=<Link prefetch="intent" className="campaign-button" tabIndex={index===active?0:-1} to={collectionGroup(menu,banner.href,null)?collectionHref(banner.href,collectionGroup(menu,banner.href,null)!.title):banner.href}>{banner.buttonText}</Link>;
        return <section key={banner.id} aria-label={title(banner)} aria-hidden={index!==active} className={`campaign-banner tone-${banner.color} desktop-${banner.desktopPlacement} mobile-${banner.mobilePlacement} button-${banner.buttonLayout}`} style={style} data-parallax={banner.parallax} data-revealed={index===active} data-animation={banner.animationEnabled?banner.animationDirection:'none'}>
          {Math.abs(index-active)<=1&&<picture className="campaign-picture">
            <source media="(max-width:850px)" sizes="100vw" srcSet={banner.mobileImageUrl?imageSrcSet(banner.mobileImageUrl,[390,600,780,960,1200],banner.mobileImageWidth)||banner.mobileImageUrl:`/images/banners/campaign-${banner.mobileImage}-mobile-440.webp`} width={banner.mobileImageWidth||440} height={banner.mobileImageHeight||901}/>
            <img className="campaign-image" src={banner.desktopImageUrl?shopifyImageURL(banner.desktopImageUrl,1920):`/images/banners/campaign-${banner.desktopImage}-desktop-1728.webp`} srcSet={banner.desktopImageUrl?imageSrcSet(banner.desktopImageUrl,[960,1280,1600,1920,2560,3200,3840],banner.desktopImageWidth):[960,1440,1728].map(width=>`/images/banners/campaign-${banner.desktopImage}-desktop-${width}.webp ${width}w`).join(', ')} sizes="100vw" alt={banner.alt.trim()||`Equator ${title(banner)} collection campaign`} width={banner.desktopImageWidth||1728} height={banner.desktopImageHeight||1035} loading={index===active||warmed===active&&index===active+1?'eager':'lazy'} fetchPriority={index===active?'high':'low'} onLoad={()=>{if(index===active)setWarmed(index);}} decoding="async"/>
          </picture>}
          <Link prefetch={index===active?'render':'none'} className="campaign-banner-link" to={collectionGroup(menu,banner.href,null)?collectionHref(banner.href,collectionGroup(menu,banner.href,null)!.title):banner.href} aria-label={`Shop ${title(banner)}`} tabIndex={index===active?0:-1}/>
          <div className="campaign-content">
            <div className="campaign-copy">
              {banner.showText&&<><h2 className="campaign-heading">{banner.heading}{banner.emphasis&&<>{banner.headingBreak?<br/>:' '}<strong>{banner.emphasis}</strong></>}</h2>{banner.description&&<p>{banner.description}</p>}</>}
              {banner.showButton&&banner.buttonLayout!=='bottom'&&button}
            </div>
          </div>
          {banner.showButton&&banner.buttonLayout==='bottom'&&<div className="campaign-bottom-button">{button}</div>}
        </section>;
      })}
      <nav hidden={!current.showNavigation} className={`campaign-navigation campaign-global-navigation tone-${current.color}`} aria-label="Campaign slide navigation">{banners.map((banner,index)=><a key={banner.id} href={`#campaign-${banner.id}`} onClick={event=>{event.preventDefault();navigate.current(index);}} aria-label={`Go to ${title(banner)}`} aria-current={index===active?'true':undefined}><span>{title(banner)}</span><i aria-hidden="true"/></a>)}</nav>
    </div>
  </div>;
}

