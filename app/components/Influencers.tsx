import {ArrowIcon} from './ArrowIcon';
import {staticAsset} from '../lib/static-assets';
import {Link} from 'react-router';
import {useEffect,useId,useRef,useState} from 'react';
import {reelSource,type InfluencerReel,type InfluencersSettings} from '../lib/influencers';
import {shopifyImageURL} from '../lib/images';

function PlayIcon(){return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m9 5 11 7-11 7Z" fill="currentColor"/></svg>;}
function ReelCard({reel,onOpen,paused}:{reel:InfluencerReel;onOpen:()=>void;paused:boolean}){
 const card=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),[near,setNear]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(false),[saveData,setSaveData]=useState(false),[failed,setFailed]=useState(false);
 const source=reelSource(reel.sources,240);
 useEffect(()=>{setSaveData(!!(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData);const m=matchMedia('(prefers-reduced-motion:reduce)'),change=()=>setReduced(m.matches);change();m.addEventListener('change',change);const node=card.current;if(!node)return;const preload=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);preload.disconnect();}},{rootMargin:'150px'}),observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.5)),{threshold:[0,.5]});preload.observe(node);observer.observe(node);return()=>{m.removeEventListener('change',change);preload.disconnect();observer.disconnect();};},[]);
 useEffect(()=>{const v=video.current;if(!v)return;const sync=()=>{if(visible&&!paused&&!reduced&&!saveData&&document.visibilityState==='visible')void v.play().catch(()=>{});else v.pause();};sync();document.addEventListener('visibilitychange',sync);return()=>{v.pause();document.removeEventListener('visibilitychange',sync);};},[visible,paused,reduced,saveData,near]);
 return <div className="influencer-card" ref={card}>
  <div className="influencer-media">
   {source&&!failed?<video ref={video} src={near&&!reduced&&!saveData?source.url:undefined} poster={near&&reel.poster?shopifyImageURL(reel.poster,600):undefined} muted loop playsInline preload={near?'metadata':'none'} autoPlay={visible&&!paused&&!reduced&&!saveData} onError={()=>setFailed(true)} aria-hidden="true" tabIndex={-1}/>:<div className="influencer-placeholder"><img src={staticAsset('/images/equator-card-sign.png')} alt="" width="64" height="64"/><span>{failed?'Video unavailable':'Videos coming soon'}</span></div>}
   <button className="influencer-open" type="button" aria-label={`Play ${reel.title}`} aria-haspopup="dialog" disabled={!source||failed} onClick={onOpen}><span className="influencer-play" aria-hidden="true"><PlayIcon/></span></button>
  </div>{reel.product&&<Link className="influencer-shop" to={`/products/${reel.product.handle}`}>Shop the look <span aria-hidden="true"><ArrowIcon/></span></Link>}
 </div>;
}
function ReelPopup({reel,onClose}:{reel:InfluencerReel;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),id=useId(),[error,setError]=useState(false),source=reelSource(reel.sources,1080);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();void video.current?.play().catch(()=>{});return()=>{video.current?.pause();dialog.current?.close();if(previous?.isConnected)previous.focus();};},[]);
 return <dialog className="influencer-dialog" ref={dialog} aria-labelledby={id} onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}>
  <button className="influencer-close" type="button" onClick={onClose} aria-label="Close video">×</button><h2 id={id} className="sr-only">{reel.title}</h2>
  <video ref={video} src={source?.url} poster={reel.poster} controls autoPlay playsInline preload="metadata" onError={()=>setError(true)} aria-label={reel.title}/>{error&&<p role="alert">This video could not be loaded. Please try again later.</p>}
  {reel.product&&<p className="influencer-caption"><Link className="influencer-shop" to={`/products/${reel.product.handle}`} onClick={onClose}>Shop {reel.product.title} <ArrowIcon/></Link></p>}
 </dialog>;
}
export function Influencers({settings}:{settings:InfluencersSettings}){
 const track=useRef<HTMLDivElement>(null),id=useId(),[active,setActive]=useState<InfluencerReel|null>(null),[edges,setEdges]=useState({start:true,end:false});
 useEffect(()=>{if(!settings.enabled)setActive(null);},[settings.enabled]);
 const reels:InfluencerReel[]=settings.reels.length?settings.reels:Array.from({length:4},(_,i)=>({id:`placeholder-${i}`,title:'Coming soon',sources:[]}));
 useEffect(()=>{const node=track.current;if(!node)return;const measure=()=>setEdges({start:node.scrollLeft<2,end:node.scrollLeft+node.clientWidth>=node.scrollWidth-2});const ro=new ResizeObserver(measure);ro.observe(node);node.addEventListener('scroll',measure,{passive:true});measure();return()=>{ro.disconnect();node.removeEventListener('scroll',measure);};},[settings.enabled,settings.reels]);
 if(!settings.enabled)return null;
 function move(direction:number){track.current?.scrollBy({left:direction*track.current.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
 return <section className="pdp-rail influencers" aria-labelledby={id}><div className="pdp-rail-heading"><h2 id={id}>{settings.heading}</h2><div><button type="button" aria-label="Previous influencer videos" disabled={edges.start} onClick={()=>move(-1)}><ArrowIcon direction="left"/></button><button type="button" aria-label="Next influencer videos" disabled={edges.end} onClick={()=>move(1)}><ArrowIcon/></button></div></div>
  <div className="pdp-rail-track influencer-track" ref={track} tabIndex={0} aria-label="Influencer videos">{reels.map(reel=><ReelCard key={reel.id} reel={reel} paused={!!active} onOpen={()=>setActive(reel)}/>)}</div>
  {active&&<ReelPopup reel={active} onClose={()=>setActive(null)}/>}
 </section>;
}
