import type { Cafe,Furniture,Item,Point,Motion } from '@/types/game';
import { ITEMS } from './catalog';
export const ISO_W=76, ISO_H=38;
export const iso=(x:number,y:number):Point=>({x:(x-y)*ISO_W/2,y:(x+y)*ISO_H/2});
export const fromIso=(x:number,y:number):Point=>({x:Math.round(x/ISO_W+y/ISO_H),y:Math.round(y/ISO_H-x/ISO_W)});
export const entry=(size:number):Point=>({x:Math.floor(size/2),y:size-1});
export const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export const key=(p:Point)=>`${p.x},${p.y}`;
export function cells(f:Furniture,items:Item[]=ITEMS):Point[]{
 const i=items.find(i=>i.id===f.itemId);if(!i)return [];
 const w=f.rotation%2?i.height:i.width,h=f.rotation%2?i.width:i.height;
 return Array.from({length:w*h},(_,n)=>({x:f.x+n%w,y:f.y+Math.floor(n/w)}));
}
export function path(c:Pick<Cafe,'size'|'layout'>,from:Point,to:Point,items:Item[]=ITEMS,allowGoal=false):Point[]|null {
 const start={x:Math.round(from.x),y:Math.round(from.y)};
 const blocked=new Set(c.layout.flatMap(f=>cells(f,items).map(key)));
 blocked.delete(key(start));if(allowGoal)blocked.delete(key(to));
 if(blocked.has(key(to)))return null;
 const q=[start],seen=new Set([key(start)]),prev=new Map<string,Point>();
 for(let n=0;n<q.length;n++){
  const p=q[n];if(same(p,to)){const out=[p];while(!same(out[0],start))out.unshift(prev.get(key(out[0]))!);return out;}
  for(const v of [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]){
   const k=key(v);if(v.x<0||v.y<0||v.x>=c.size||v.y>=c.size||blocked.has(k)||seen.has(k))continue;seen.add(k);prev.set(k,p);q.push(v);
  }
 }return null;
}
export function access(c:Pick<Cafe,'size'|'layout'>,f:Furniture,from:Point,items:Item[]=ITEMS):Point[]|null {
 const occupied=cells(f,items);const options=occupied.flatMap(p=>[{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]);
 const paths=options.map(p=>path(c,from,p,items)).filter((p):p is Point[]=>!!p);return paths.sort((a,b)=>a.length-b.length)[0]||null;
}
export function validLayout(c:Pick<Cafe,'size'|'layout'>,items:Item[]=ITEMS):string|null {
 const used=new Set<string>();const ids=new Set<string>();
 for(const f of c.layout){
  if(ids.has(f.id))return 'Móvel duplicado.';ids.add(f.id);
  if(!items.find(i=>i.id===f.itemId))return 'Item desconhecido.';
  if(![f.x,f.y,f.rotation].every(Number.isInteger)||f.rotation<0||f.rotation>3)return 'Posição inválida.';
  for(const p of cells(f,items)){if(p.x<0||p.y<0||p.x>=c.size||p.y>=c.size)return 'Posicione o móvel dentro do café.';if(same(p,entry(c.size)))return 'Deixe a entrada livre.';if(used.has(key(p)))return 'Já existe um móvel nesse espaço.';used.add(key(p));}
 }
 for(const f of c.layout){const kind=items.find(i=>i.id===f.itemId)!.kind;if(['stove','counter'].includes(kind)&&!access(c,f,entry(c.size),items))return 'Mantenha um caminho livre até os fogões e balcões.';}
 return null;
}
export function seats(c:Cafe,items:Item[]=ITEMS){
 const chairs=c.layout.filter(f=>items.find(i=>i.id===f.itemId)?.kind==='chair');
 const tables=c.layout.filter(f=>items.find(i=>i.id===f.itemId)?.kind==='table');
 return chairs.flatMap(chair=>{const table=tables.find(t=>Math.abs(t.x-chair.x)+Math.abs(t.y-chair.y)===1);return table&&path(c,entry(c.size),chair,items,true)&&access(c,table,entry(c.size),items)?[{chair,table}]:[];});
}
export const motionEnd=(m:Motion)=>m.startedAt+Math.max(0,m.path.length-1)*m.stepMs;
export function position(m:Motion,now:number):Point{
 const t=Math.max(0,(now-m.startedAt)/m.stepMs),i=Math.min(Math.floor(t),m.path.length-1),a=m.path[i]||{x:0,y:0},b=m.path[Math.min(i+1,m.path.length-1)]||a;
 return {x:a.x+(b.x-a.x)*Math.min(1,t-i),y:a.y+(b.y-a.y)*Math.min(1,t-i)};
}
