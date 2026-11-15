import {useState} from 'react';
import {Link} from 'react-router';
import {useBannerSettings} from '../components/BannerSettingsProvider';
import type {BannerSettings,AnimationDirection,BannerPlacement} from '../content/banners';
export default function BannerSettingsPage() {
  const {banners,update,reset}=useBannerSettings();
  const [selected,setSelected]=useState(banners[0].id);
  const banner=banners.find(item=>item.id===selected)||banners[0];
  const [feedback,setFeedback]=useState('');
  function patch(value:Partial<BannerSettings>) {update(banner.id,value);setFeedback('Updated in this browser’s preview.');}
  return <section className="banner-editor">
    <h1>Banner settings</h1><p>Changes apply to this browser’s local preview. Shopify content and the live store are unchanged.</p>
    <div className="editor-actions"><Link to="/">View homepage</Link><button onClick={()=>{reset();setFeedback('Figma defaults restored.');}}>Restore defaults</button></div>
    <label>Campaign<select value={banner.id} onChange={e=>setSelected(e.target.value)}>{banners.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
    <fieldset><legend>Text and button</legend>
      <label>Heading<input value={banner.heading} onChange={e=>patch({heading:e.target.value})}/></label>
      <label>Heading continuation / second line<textarea value={banner.emphasis} onChange={e=>patch({emphasis:e.target.value})}/></label>
      <label className="editor-check"><input type="checkbox" checked={banner.headingBreak} onChange={e=>patch({headingBreak:e.target.checked})}/>Start continuation on a new line</label>
      <label>Additional text<textarea value={banner.description} onChange={e=>patch({description:e.target.value})}/></label>
      <label>Button text<input value={banner.buttonText} onChange={e=>patch({buttonText:e.target.value})}/></label>
      <label>Button destination<input value={banner.href} onChange={e=>patch({href:e.target.value})}/></label>
      <label>Text color<select value={banner.color} onChange={e=>patch({color:e.target.value as BannerSettings['color']})}><option value="light">White</option><option value="dark">Black</option></select></label>
      <label>Button layout<select value={banner.buttonLayout} onChange={e=>patch({buttonLayout:e.target.value as BannerSettings['buttonLayout']})}><option value="stacked">Below heading</option><option value="inline">Beside heading</option><option value="bottom">Bottom of banner</option></select></label>
    </fieldset>
    <fieldset><legend>Desktop and mobile</legend>{(['desktop','mobile'] as const).map(device=><div className="editor-device" key={device}><h2>{device}</h2>
      <label>Banner image<select value={banner[`${device}Image`]} onChange={e=>patch({[`${device}Image`]:Number(e.target.value)})}>{banners.map((item,i)=><option value={i+1} key={item.id}>{item.label}</option>)}</select></label>
      <label>Horizontal position<select value={banner[`${device}Placement`]} onChange={e=>patch({[`${device}Placement`]:e.target.value as BannerPlacement})}>{['left','center','right'].map(position=><option key={position}>{position}</option>)}</select></label>
      <label>Heading maximum width (px)<input type="number" min="160" max="900" value={banner[`${device}HeadingMaxWidth`]} onChange={e=>patch({[`${device}HeadingMaxWidth`]:Math.max(160,Math.min(900,Number(e.target.value)||340))})}/></label>
      <label>{device==='desktop'?'Content center from top (%)':'Content bottom from top (%)'}<input type="number" min="5" max="85" value={banner[`${device}Top`]} onChange={e=>patch({[`${device}Top`]:Math.max(5,Math.min(85,Number(e.target.value)))})}/></label>
    </div>)}</fieldset>
    <fieldset><legend>Visibility and motion</legend>{([
      ['showText','Show heading and text'],['showButton','Show shop button'],['showNavigation','Show banner navigation'],['animationEnabled','Enable text entrance animation'],['parallax','Enable parallax'],
    ] as const).map(([key,label])=><label className="editor-check" key={key}><input type="checkbox" checked={banner[key]} onChange={e=>patch({[key]:e.target.checked})}/>{label}</label>)}
      <label>Animation direction<select value={banner.animationDirection} onChange={e=>patch({animationDirection:e.target.value as AnimationDirection})}><option value="up">Slide up</option><option value="down">Slide down</option><option value="left">Slide left</option><option value="right">Slide right</option></select></label>
    </fieldset><p role="status">{feedback}</p>
  </section>;
}
