"use client";
import { useEffect,useRef,useState } from 'react';
import type { GameState } from '@/types/game';
import type { CafeScene,SceneBridge } from '@/game/scenes/CafeScene';
import Icon from './Icon';
export default function CafeGame({state,editing=false,selected='',placing='',rotation=0,bridge}:{state:GameState;editing?:boolean;selected?:string;placing?:string;rotation?:number;bridge:SceneBridge}){
 const host=useRef<HTMLDivElement>(null),scene=useRef<CafeScene|null>(null),latest=useRef(state),callback=useRef(bridge);latest.current=state;callback.current=bridge;
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let disposed=false;let game:import('phaser').Game|undefined;
  Promise.all([import('phaser'),import('@/game/scenes/CafeScene')]).then(([Phaser,{CafeScene}])=>{
   if(disposed||!host.current)return;
   const bridge:SceneBridge={select:id=>callback.current.select(id),move:(id,x,y)=>callback.current.move(id,x,y),place:(x,y)=>callback.current.place(x,y),stove:id=>callback.current.stove(id),notice:s=>callback.current.notice(s)};
   scene.current=new CafeScene(latest.current,bridge);
   game=new Phaser.Game({type:Phaser.CANVAS,parent:host.current,backgroundColor:'#a9bd86',scene:scene.current,antialias:true,render:{pixelArt:false,roundPixels:false},scale:{mode:Phaser.Scale.RESIZE,width:host.current.clientWidth,height:host.current.clientHeight},input:{activePointers:2},fps:{target:45,forceSetTimeOut:false},audio:{noAudio:true}});
   setReady(true);
  }).catch(()=>setError('Não foi possível abrir o restaurante. Atualize a página.'));
  return()=>{disposed=true;game?.destroy(true);scene.current=null;};
 },[]);
 useEffect(()=>{scene.current?.setState(state);},[state,ready]);
 useEffect(()=>{scene.current?.setMode(editing,selected,placing,rotation);},[editing,selected,placing,rotation,ready]);
 return <div className="restaurant-stage"><div ref={host} className="phaser-host" role="application" aria-label="Restaurante isométrico interativo. Clique nos fogões para cozinhar; use Decorar para mover móveis."/>{(!ready||error)&&<div className="game-loading"><Icon name="cup" size={46}/>{error||'Acendendo as luzes do café…'}</div>}<div className="camera-controls"><button aria-label="Aproximar" onClick={()=>scene.current?.zoomBy(1.15)}>+</button><button aria-label="Afastar" onClick={()=>scene.current?.zoomBy(.87)}>−</button><button aria-label="Centralizar restaurante" onClick={()=>scene.current?.fit()}><Icon name="expand"/></button></div><div className="stage-hint">{editing?(placing?'Toque em um espaço livre para posicionar':'Arraste um móvel para mudar de lugar'):'Arraste para explorar · Role para aproximar'}</div></div>;
}
