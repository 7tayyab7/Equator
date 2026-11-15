function ViewIcon({index}:{index:number}){
 return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth=".8" aria-hidden="true" focusable="false"><rect x="1" y="1" width="22" height="22"/>{index>0&&<path d="M12 1v22"/>}{index===2&&<path d="M1 12h22"/>}</svg>;
}
export function CollectionViewOptions({desktop,mobile,onDesktop,onMobile}:{desktop:number;mobile:number;onDesktop:(columns:number)=>void;onMobile:(columns:number)=>void}){
 return <div className="collection-view-options">
  <div className="collection-view-desktop" role="group" aria-label="Products per row">{[2,4,6].map((columns,index)=><button type="button" key={columns} aria-label={`${columns} products per row`} aria-pressed={desktop===columns} onClick={()=>onDesktop(columns)}><ViewIcon index={index}/></button>)}</div>
  <div className="collection-view-mobile" role="group" aria-label="Products per row">{[1,2].map((columns,index)=><button type="button" key={columns} aria-label={`${columns} ${columns===1?'product':'products'} per row`} aria-pressed={mobile===columns} onClick={()=>onMobile(columns)}><ViewIcon index={index}/></button>)}</div>
 </div>;
}
