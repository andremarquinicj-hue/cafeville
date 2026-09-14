import type { CSSProperties } from 'react';
import { ART_FRAMES,ART_SHEETS,artFrameKey } from '@/game/art/nostalgia';

type Props={src?:string;itemId?:string;alt?:string;className?:string;style?:CSSProperties;portrait?:boolean};

/** Display an atlas frame directly; the original PNG is kept intact. */
export default function GameArt({src,itemId,alt='',className='',style,portrait=false}:Props){
 const key=artFrameKey(src,itemId),frame=key?ART_FRAMES[key]:undefined;
 if(!frame)return <img src={src||'/assets/game/ui/box.svg'} alt={alt} className={`game-art ${className}`} style={style} draggable={false}/>;
 const sheet=ART_SHEETS[frame.sheet],box=frame.ui;
 const height=portrait?Math.min(box.h,box.w*1.1):box.h;
 return <svg className={`game-art ${className}`} style={style} viewBox={`${box.x} ${box.y} ${box.w} ${height}`} preserveAspectRatio="xMidYMid meet" role={alt?'img':undefined} aria-label={alt||undefined} aria-hidden={alt?undefined:true}>
  <image href={sheet.url} x="0" y="0" width={sheet.width} height={sheet.height}/>
 </svg>;
}
