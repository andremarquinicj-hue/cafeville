import * as Phaser from 'phaser';
import type { GameState,Furniture,Point,Cafe } from '@/types/game';
import { iso,fromIso,entry,position,motionEnd,cells,validLayout } from '@/game/core/grid';
import { advance } from '@/game/core/simulation';
export type SceneBridge={select:(id:string)=>void;move:(id:string,x:number,y:number)=>void;place:(x:number,y:number)=>void;stove:(id:string)=>void;notice:(message:string)=>void};
export class CafeScene extends Phaser.Scene {
 state!:GameState; bridge!:SceneBridge; editing=false; selected=''; placing=''; previewRotation=0;
 private world!:Phaser.GameObjects.Container;private props=new Map<string,Phaser.GameObjects.Image>();private people=new Map<string,Phaser.GameObjects.Image>();private bubbles=new Map<string,Phaser.GameObjects.Container>();private ghosts!:Phaser.GameObjects.Graphics;
 private dishes=new Map<string,Phaser.GameObjects.Image>();private confirmedCoins=0;private confirmedLevel=1;private environment:Phaser.GameObjects.GameObject[]=[];private markers=new Map<string,Phaser.GameObjects.Text>();private backgroundKey='';private offset=0;private pointerStart:Point|null=null;private panStart:Point={x:0,y:0};private dragged='';private moved=false;private lastPinch=0;private lastSim=0;private objectKey='';private isReady=false;
 constructor(state:GameState,bridge:SceneBridge){super('CafeScene');this.state=structuredClone(state);this.bridge=bridge;this.offset=state.now-Date.now();this.confirmedCoins=state.player.coins;this.confirmedLevel=state.player.level;}
 preload(){
  for(const url of [...new Set([...this.state.items.map(i=>i.art),...this.state.recipes.map(r=>r.art)])])this.load.svg(url,url);
  for(const role of ['chef','waiter','cleaner',...Array.from({length:6},(_,n)=>`guest${n}`),...Array.from({length:6},(_,n)=>`guest${n}-seat`)])for(let f=0;f<4;f++)this.load.svg(`${role}-${f}`,`/assets/game/characters/${role}-${f}.svg`);
 }
 create(){
  this.world=this.add.container(0,0);this.ghosts=this.add.graphics().setDepth(100000);this.isReady=true;
  this.input.addPointer(1);this.cameras.main.setBackgroundColor('#a9bd86');this.drawEnvironment();this.drawProps();this.fit();
  this.scale.on('resize',()=>this.fit());
  this.input.on('gameobjectdown',(pointer:Phaser.Input.Pointer,object:Phaser.GameObjects.Image)=>{
   const id=object.getData('furnitureId');if(!id)return;
   if(this.editing){this.selected=id;this.dragged=id;this.bridge.select(id);}else if(this.state.items.find(i=>i.id===this.state.cafe.layout.find(f=>f.id===id)?.itemId)?.kind==='stove')this.bridge.stove(id);else{const stock=this.state.cafe.counters[id];if(stock?.portions)this.bridge.notice(`${stock.name}: ${stock.portions} porções.`);}
  });
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{this.pointerStart={x:p.x,y:p.y};this.panStart={x:this.cameras.main.scrollX,y:this.cameras.main.scrollY};this.moved=false;});
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{
   if(this.input.pointer1.isDown&&this.input.pointer2.isDown){const distance=Phaser.Math.Distance.Between(this.input.pointer1.x,this.input.pointer1.y,this.input.pointer2.x,this.input.pointer2.y);if(this.lastPinch)this.zoomBy(distance/this.lastPinch);this.lastPinch=distance;this.moved=true;return;}
   const w=this.cameras.main.getWorldPoint(p.x,p.y),cell=fromIso(w.x,w.y);
   if(this.editing&&(this.placing||this.dragged))this.preview(cell);
   if(p.isDown&&this.pointerStart){const dx=p.x-this.pointerStart.x,dy=p.y-this.pointerStart.y;this.moved=Math.hypot(dx,dy)>6||this.moved;
    if(this.dragged){if(this.moved){const f=this.props.get(this.dragged);const pos=iso(cell.x,cell.y);f?.setPosition(pos.x,pos.y).setAlpha(.65);}}else if(!this.placing)this.cameras.main.setScroll(this.panStart.x-dx/this.cameras.main.zoom,this.panStart.y-dy/this.cameras.main.zoom);
   }
  });
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{
   const w=this.cameras.main.getWorldPoint(p.x,p.y),cell=fromIso(w.x,w.y);
   if(this.dragged&&this.moved)this.bridge.move(this.dragged,cell.x,cell.y);
   else if(!this.moved&&this.placing)this.bridge.place(cell.x,cell.y);
   this.dragged='';this.pointerStart=null;this.lastPinch=0;this.ghosts.clear();this.objectKey='';this.drawProps();
  });
  this.input.on('wheel',(_p:unknown,_over:unknown,_dx:number,dy:number)=>this.zoomBy(dy>0?.92:1.08));
  this.input.keyboard?.on('keydown-ESC',()=>{this.placing='';this.selected='';this.ghosts.clear();});
 }
 setState(state:GameState){const oldLevel=this.confirmedLevel,diff=state.player.coins-this.confirmedCoins;this.confirmedLevel=state.player.level;this.confirmedCoins=state.player.coins;this.state=structuredClone(state);this.offset=state.now-Date.now();if(!this.isReady)return;this.drawEnvironment();this.drawProps();if(state.player.level>oldLevel)this.confetti();if(diff>0){const point=iso(entry(state.cafe.size).x,entry(state.cafe.size).y);const text=this.add.text(point.x,point.y-50,`+${Math.floor(diff)}`,{fontFamily:'Georgia',fontSize:'26px',color:'#fff0a8',stroke:'#826032',strokeThickness:4}).setOrigin(.5).setDepth(12000);this.tweens.add({targets:text,y:text.y-80,alpha:0,duration:2200,onComplete:()=>text.destroy()});}}
 setMode(editing:boolean,selected:string,placing:string,rotation=0){this.editing=editing;this.selected=selected;this.placing=placing;this.previewRotation=rotation;this.objectKey='';if(this.isReady){this.drawProps();if(!editing)this.ghosts.clear();}}
 zoomBy(factor:number){this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom*factor,.45,2.8));}
 fit(){if(!this.isReady)return;const c=this.cameras.main,n=this.state.cafe.size;const width=n*76+180,height=n*38+230;c.setZoom(Math.min(c.width/width,c.height/height)*.95);c.centerOn(0,(n*38-155)/2);}
 private polygon(g:Phaser.GameObjects.Graphics,points:Point[],fill:number,line=0x876647,alpha=1){g.fillStyle(fill,alpha);g.fillPoints(points,true);g.lineStyle(1,line,.3);g.strokePoints(points,true);}
 private drawEnvironment(){
  const cafe=this.state.cafe,k=JSON.stringify([cafe.size,cafe.styles]);if(k===this.backgroundKey)return;this.backgroundKey=k;
  this.environment.forEach(o=>o.destroy());this.environment=[];const add=(o:Phaser.GameObjects.GameObject)=>{this.environment.push(o);return o;};const g=add(this.add.graphics().setDepth(-10000)) as Phaser.GameObjects.Graphics,n=cafe.size;
  const autumn=cafe.styles.theme==='tema_outono';this.cameras.main.setBackgroundColor(autumn?'#c4b17e':'#a9bd86');
  // Soft outdoor garden and cobblestone terrace, all original vector geometry.
  for(let x=-2;x<n+2;x++)for(let y=-2;y<n+2;y++){
   const a=iso(x-.5,y-.5),b=iso(x+.5,y-.5),c=iso(x+.5,y+.5),d=iso(x-.5,y+.5);
   this.polygon(g,[a,b,c,d],x>=0&&y>=0&&x<n&&y<n?0xe0bc85:((x+y)%2===0?0xd5ceb3:0xcac7a9));
   if(x>=0&&y>=0&&x<n&&y<n){
    const color=this.state.items.find(i=>i.id===cafe.styles.floor)?.color||'#d8ae78';this.polygon(g,[a,b,c,d],Phaser.Display.Color.HexStringToColor(color).color,0x926f48,.92);
    if(cafe.styles.floor==='piso_madeira'){g.lineStyle(.7,0xa57f50,.42);for(const v of [-.2,.15]){const q=iso(x+v,y-.5),r=iso(x+v,y+.5);g.lineBetween(q.x,q.y,r.x,r.y);}}
   }
  }
  const top=iso(-.5,-.5),left=iso(-.5,n-.5),right=iso(n-.5,-.5),height=135;
  const wallColor=Phaser.Display.Color.HexStringToColor(this.state.items.find(i=>i.id===cafe.styles.wall)?.color||'#f5e4ba').color;
  for(const end of [left,right]){
   this.polygon(g,[top,end,{x:end.x,y:end.y-height},{x:top.x,y:top.y-height}],wallColor);
   this.polygon(g,[top,end,{x:end.x,y:end.y-32},{x:top.x,y:top.y-32}],0xa97947);
   g.lineStyle(7,0x825630);g.lineBetween(top.x,top.y-height,end.x,end.y-height);g.lineStyle(4,0xd7a66a);g.lineBetween(top.x,top.y-33,end.x,end.y-33);
  }
  const wallRect=(axis:'x'|'y',start:number,length:number,bottom:number,h:number,fill:number)=>{
   const a=axis==='x'?iso(start,-.5):iso(-.5,start),b=axis==='x'?iso(start+length,-.5):iso(-.5,start+length);return this.polygon(g,[{x:a.x,y:a.y-bottom},{x:b.x,y:b.y-bottom},{x:b.x,y:b.y-bottom-h},{x:a.x,y:a.y-bottom-h}],fill);
  };
  for(const axis of ['x','y'] as const)for(let i=0;i<n;i++){wallRect(axis,i-.45,.07,0,32,0x795533);}
  for(const s of [1,4]){
   wallRect('y',s,1.6,49,67,0x865931);wallRect('y',s+.14,1.32,54,57,0xb7dbce);wallRect('y',s+.7,.13,54,57,0xc79959);wallRect('y',s+.14,1.32,81,4,0xc79959);
  }
  wallRect('x',2.6,2.8,51,68,0x805631);wallRect('x',2.75,2.5,55,60,0x344e43);
  const board=iso(2.9,-.5);add(this.add.text(board.x,board.y-111,'BOAS COMIDAS\nBOAS COMPANHIAS',{fontFamily:'Trebuchet MS',fontSize:'12px',color:'#f6e7be',lineSpacing:7}).setRotation(.46365).setDepth(-9000));
  for(let i=0;i<7;i++){
   const p=iso(n+1,i*1.5-1);g.fillStyle(0x667a49,.22);g.fillEllipse(p.x,p.y+10,90,27);
   for(let j=0;j<6;j++){g.fillStyle(autumn?[0xb9843e,0xc49d4c,0x8e8a48][j%3]:[0x688b50,0x7b9f56,0x93ad62][j%3]);g.fillCircle(p.x+Math.sin(j*2)*22,p.y-8+Math.cos(j*2)*13,23);}
  }
  const e=entry(n),mat=iso(e.x,e.y+1.2);this.polygon(g,[{x:mat.x-60,y:mat.y},{x:mat.x,y:mat.y-30},{x:mat.x+60,y:mat.y},{x:mat.x,y:mat.y+30}],0x9f6544);
  add(this.add.text(mat.x,mat.y-4,'CaféVille',{fontFamily:'Georgia',fontStyle:'italic',fontSize:'17px',color:'#fcebc4'}).setOrigin(.5).setRotation(-.46).setDepth(-9000));
  const gate=add(this.add.graphics().setDepth(7000)) as Phaser.GameObjects.Graphics;for(const x of [-1,1]){const p=iso(e.x+x*.75,e.y+.4);gate.fillStyle(0x875b37);gate.fillRoundedRect(p.x-4,p.y-42,8,46,2);gate.fillStyle(0xe3bb76);gate.fillCircle(p.x,p.y-43,6);}
  this.fit();
 }
 private drawProps(){
  const k=JSON.stringify([this.state.cafe.layout,this.editing,this.selected]);if(k===this.objectKey)return;this.objectKey=k;
  for(const [id,s]of this.props)if(!this.state.cafe.layout.some(f=>f.id===id)){s.destroy();this.props.delete(id);}
  for(const f of this.state.cafe.layout){const item=this.state.items.find(i=>i.id===f.itemId);if(!item)continue;const w=f.rotation%2?item.height:item.width,h=f.rotation%2?item.width:item.height;const p=iso(f.x+(w-1)/2,f.y+(h-1)/2);
   let sprite=this.props.get(f.id);if(!sprite){sprite=this.add.image(p.x,p.y,item.art).setOrigin(.5,.92).setDisplaySize(item.width>1?139:92,item.width>1?111:109).setData('furnitureId',f.id).setInteractive({pixelPerfect:true,alphaTolerance:24,useHandCursor:true});this.props.set(f.id,sprite);}
   sprite.setPosition(p.x,p.y).setDepth((f.x+f.y)*100+10).setFlipX(f.rotation%2===1).setAlpha(1);if(this.editing&&f.id===this.selected)sprite.setTint(0xffe8aa);else sprite.clearTint();
  }
 }
 private preview(cell:Point){
  this.ghosts.clear();const c=this.state.cafe,f=this.dragged?c.layout.find(f=>f.id===this.dragged):{id:'preview',itemId:this.placing,...cell,rotation:this.previewRotation};if(!f)return;const proposed={...f,...cell};const error=validLayout({...c,layout:[...c.layout.filter(x=>x.id!==f.id),proposed]},this.state.items);
  for(const p of cells(proposed,this.state.items)){const points=[iso(p.x-.5,p.y-.5),iso(p.x+.5,p.y-.5),iso(p.x+.5,p.y+.5),iso(p.x-.5,p.y+.5)];this.polygon(this.ghosts,points,error?0xd56850:0x7ba45e,0xffffff,.6);}
 }
 private label(id:string,x:number,y:number,text:string,color='#fff7db'){
  let t=this.markers.get(id);if(!t){t=this.add.text(x,y,text,{fontFamily:'Trebuchet MS',fontSize:'12px',color,backgroundColor:'#4c6046',padding:{x:7,y:4}}).setOrigin(.5,1).setDepth(8000);this.markers.set(id,t);}t.setPosition(x,y).setText(text).setColor(color);
 }
 private confetti(){for(let i=0;i<35;i++){const x=this.cameras.main.midPoint.x+(Math.random()-.5)*400,y=this.cameras.main.midPoint.y-140;const s=this.add.circle(x,y,3,[0xf7cc6c,0xe79869,0x93b677][i%3]).setDepth(12000);this.tweens.add({targets:s,y:y+300,x:x+(Math.random()-.5)*160,alpha:0,duration:1800+Math.random()*800,onComplete:()=>s.destroy()});}}
 update(){
  if(!this.isReady)return;const now=Date.now()+this.offset;
  if(now-this.lastSim>200){advance(this.state.cafe,this.state.player,now,this.state.items);this.lastSim=now;}
  const active=new Set<string>(),labels=new Set<string>(),foods=new Set<string>(),c=this.state.cafe;
  const dish=(id:string,art:string,x:number,y:number,depth:number,size=38)=>{foods.add(id);let sprite=this.dishes.get(id);if(!sprite){sprite=this.add.image(x,y,art).setDisplaySize(size,size);this.dishes.set(id,sprite);}sprite.setTexture(art).setPosition(x,y).setDepth(depth);};
  const person=(id:string,role:string,motion:import('@/types/game').Motion,state:string,tableId='',carrying=false)=>{
   active.add(id);const pt=position(motion,now),p=iso(pt.x,pt.y),walking=now<motionEnd(motion),frame=walking?Math.floor(now/140)%4:0;
   let s=this.people.get(id);if(!s){s=this.add.image(p.x,p.y,`${role}-0`).setOrigin(.5,.94).setDisplaySize(44,66);this.people.set(id,s);}
   const bob=walking?Math.sin(now/70)*1.4:state==='cooking'||state==='cleaning'?Math.sin(now/180)*1.1:0;
   s.setTexture(`${role}${role.startsWith('guest')&&(state==='waiting'||state==='eating')?'-seat':''}-${frame}`).setPosition(p.x,p.y+(state==='waiting'||state==='eating'?-8:0)+bob).setDepth((pt.x+pt.y)*100+65);
   const idx=Math.min(motion.path.length-1,Math.floor(Math.max(0,(now-motion.startedAt)/motion.stepMs))),a=motion.path[idx],b=motion.path[Math.min(idx+1,motion.path.length-1)];if(a&&b&&a.x!==b.x||a&&b&&a.y!==b.y)s.setFlipX(iso((b?.x||0)-(a?.x||0),(b?.y||0)-(a?.y||0)).x<0);
   if(state==='waiting'){this.label(`mood-${id}`,p.x,p.y-72,'•••');labels.add(`mood-${id}`);}else if(state==='eating'){this.label(`mood-${id}`,p.x,p.y-70,'Bom apetite','#f9e5af');labels.add(`mood-${id}`);}else if(state==='leaving'){this.label(`mood-${id}`,p.x,p.y-70,tableId==='happy'?'Obrigado!':'Sem atendimento',tableId==='happy'?'#e8f5c4':'#ffc3a5');labels.add(`mood-${id}`);}
   if(carrying){this.label(`tray-${id}`,p.x+15,p.y-34,'Prato');labels.add(`tray-${id}`);}
  };
  for(const g of c.sim.customers){person(g.id,`guest${g.avatar}`,g.motion,g.state,g.happy?'happy':'sad');if(g.state==='eating'&&g.art){const table=c.layout.find(f=>f.id===g.tableId);if(table){const p=iso(table.x,table.y);dish(`plate-${g.id}`,g.art,p.x+10,p.y-49,(table.x+table.y)*100+50,34);}}}
  for(const w of c.sim.workers){person(w.role,w.role,w.motion,w.state);if(w.carrying){const pos=position(w.motion,now),p=iso(pos.x,pos.y);dish(`tray-${w.role}`,w.carrying.art,p.x+17,p.y-32,(pos.x+pos.y)*100+70,27);}}
  for(const [id,s]of this.people)if(!active.has(id)){s.destroy();this.people.delete(id);}
  for(const f of c.layout){const p=iso(f.x,f.y),job=c.jobs.find(j=>j.stoveId===f.id),stock=c.counters[f.id];
   if(job){const text=now>=job.spoilsAt?'Limpar':now>=job.readyAt?'Pronto!':`${Math.ceil((job.readyAt-now)/1000)}s`;this.label(f.id,p.x,p.y-96,text,now>=job.spoilsAt?'#ffb695':'#fff1c8');labels.add(f.id);}
   if(stock?.portions>0){dish(`counter-${f.id}`,stock.art,p.x,p.y-57,(f.x+f.y)*100+40,41);this.label(`stock-${f.id}`,p.x,p.y-76,`${stock.portions} porções`);labels.add(`stock-${f.id}`);}
   if(c.dirty[f.id]){this.label(`dirty-${f.id}`,p.x,p.y-84,'Limpeza');labels.add(`dirty-${f.id}`);}
  }
  for(const [id,s]of this.dishes)if(!foods.has(id)){s.destroy();this.dishes.delete(id);}
  for(const [id,t]of this.markers)if(!labels.has(id)){t.destroy();this.markers.delete(id);}
 }
}
