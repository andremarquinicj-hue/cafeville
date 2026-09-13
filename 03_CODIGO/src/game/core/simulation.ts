import type { Cafe,Player,Item,Point,Customer,Worker } from '@/types/game';
import { ITEMS } from './catalog';
import { access,entry,path,position,motionEnd,seats } from './grid';
import { awardXp,stat,resetPeriods } from './state';
const stationary=(p:Point,t:number)=>({path:[p],startedAt:t,stepMs:500});
const workerPoint=(w:Worker,t:number)=>{const p=position(w.motion,t);return {x:Math.round(p.x),y:Math.round(p.y)};};
export function resetSimulation(c:Cafe,now:number){
 // Return reserved food before an edit, disconnect or closure. No customer pays twice.
 for(const w of c.sim.workers)if(w.carrying&&w.counterId&&c.layout.some(f=>f.id===w.counterId)){
  const old=c.counters[w.counterId];if(!old)c.counters[w.counterId]={...w.carrying,portions:1};else if(old.recipeId===w.carrying.recipeId)old.portions++;
 }
 for(const customer of c.sim.customers)if(customer.state==='eating'){
  const stock=Object.values(c.counters).find(s=>s.art===customer.art);if(stock)stock.portions++;
 }
 c.sim={at:now,nextArrival:now+5000,sequence:c.sim.sequence,customers:[],workers:[]};c.dirty={};
}
export function advance(c:Cafe,p:Player,now:number,items:Item[]=ITEMS){
 resetPeriods(c,p,now);
 // Recipes use absolute timestamps. Restaurant service resumes on presence; no offline income.
 if(now-c.sim.at>15000){resetSimulation(c,now);return;}
 if(!c.sim.workers.length)c.sim.workers=(['chef','waiter','cleaner'] as const).map((role,i)=>({role,state:'idle',motion:stationary({x:4,y:3+i},c.sim.at),targetId:'',counterId:'',until:0,carrying:null}));
 for(let t=c.sim.at+250;t<=now;t+=250){
  if(c.open&&t>=c.sim.nextArrival){
   c.sim.nextArrival=t+Math.round(9000-p.popularity*45);
   const seat=seats(c,items).find(s=>!c.dirty[s.table.id]&&!c.sim.customers.some(x=>x.chairId===s.chair.id&&x.state!=='leaving'));
   if(seat&&c.sim.customers.length<12){
    const route=path(c,entry(c.size),seat.chair,items,true)!;c.sim.sequence++;
    c.sim.customers.push({id:`guest-${c.sim.sequence}`,avatar:c.sim.sequence%6,state:'walking',chairId:seat.chair.id,tableId:seat.table.id,motion:{path:route,startedAt:t,stepMs:520},deadline:t+60000,seatedAt:0,eatUntil:0,price:0,art:'',happy:true});
   }else p.popularity=Math.max(0,p.popularity-.3);
  }
  const leave=(guest:Customer,happy:boolean)=>{
   const from=position(guest.motion,t);const route=path(c,{x:Math.round(from.x),y:Math.round(from.y)},entry(c.size),items)||[entry(c.size)];
   guest.state='leaving';guest.happy=happy;guest.motion={path:route,startedAt:t,stepMs:520};
  };
  for(const guest of c.sim.customers){
   if(guest.state==='walking'&&t>=motionEnd(guest.motion)){guest.state='waiting';guest.seatedAt=t;guest.deadline=t+45000;}
   if(guest.state==='waiting'&&t>=guest.deadline){p.popularity=Math.max(0,p.popularity-.7);leave(guest,false);}
   if(guest.state==='eating'&&t>=guest.eatUntil){
    p.coins+=guest.price;stat(c,'earned',guest.price);stat(c,'served');awardXp(p,2);
    const decor=c.layout.filter(f=>['plant','lamp'].includes(items.find(i=>i.id===f.itemId)?.kind||'')).length;
    p.popularity=Math.min(100,p.popularity+(guest.happy?.3:.1)+Math.min(.12,decor*.02));
    c.dirty[guest.tableId]=t;leave(guest,true);
   }
  }
  c.sim.customers=c.sim.customers.filter(g=>g.state!=='leaving'||t<motionEnd(g.motion)+500);
  for(const w of c.sim.workers){
   const speed=1+(c.staff[w.role]-1)*.1;
   const walk=(route:Point[],state:Worker['state'],targetId:string)=>{w.motion={path:route,startedAt:t,stepMs:Math.round(440/speed)};w.state=state;w.targetId=targetId;w.until=motionEnd(w.motion);};
   if(w.role==='waiter'){
    if(w.state==='idle'){
     const guest=c.sim.customers.find(g=>g.state==='waiting');
     if(guest){const table=c.layout.find(f=>f.id===guest.tableId);const counter=c.layout.find(f=>c.counters[f.id]?.portions>0&&access(c,f,workerPoint(w,t),items));
      if(table&&counter&&access(c,table,workerPoint(w,t),items)){w.counterId=counter.id;walk(access(c,counter,workerPoint(w,t),items)!,'pickup',guest.id);}
     }
    }else if(w.state==='pickup'&&t>=w.until+700/speed){
     const guest=c.sim.customers.find(g=>g.id===w.targetId&&g.state==='waiting'),stock=c.counters[w.counterId],table=c.layout.find(f=>f.id===guest?.tableId);
     const route=table?access(c,table,workerPoint(w,t),items):null;
     if(guest&&stock?.portions>0&&route){w.carrying={...stock,portions:1};stock.portions--;walk(route,'serving',guest.id);}else{w.state='idle';w.targetId='';}
    }else if(w.state==='serving'&&t>=w.until+600/speed){
     const guest=c.sim.customers.find(g=>g.id===w.targetId&&g.state==='waiting');
     if(guest&&w.carrying){guest.state='eating';guest.price=w.carrying.price;guest.art=w.carrying.art;guest.eatUntil=t+7500;guest.happy=t-guest.seatedAt<20000;}
     else if(w.carrying){const stock=c.counters[w.counterId];if(stock&&stock.recipeId===w.carrying.recipeId)stock.portions++;}
     w.carrying=null;w.state='idle';w.targetId='';
    }
   }
   if(w.role==='cleaner'){
    if(w.state==='idle'){
     const table=c.layout.find(f=>c.dirty[f.id]);const route=table?access(c,table,workerPoint(w,t),items):null;
     if(table&&route)walk(route,'cleaning',table.id);
    }else if(w.state==='cleaning'&&t>=w.until+3000/speed){delete c.dirty[w.targetId];w.state='idle';w.targetId='';}
   }
   if(w.role==='chef'){
    const cooking=c.jobs.filter(j=>j.readyAt>t);const job=cooking.find(j=>j.stoveId===w.targetId)||cooking[0];
    if(job&&job.stoveId!==w.targetId){const stove=c.layout.find(f=>f.id===job.stoveId),route=stove?access(c,stove,workerPoint(w,t),items):null;if(route)walk(route,'cooking',job.stoveId);}
    if(!job){w.state='idle';w.targetId='';}
   }
  }
  c.sim.at=t;
 }
 p.popularity=Math.round(p.popularity*100)/100;
}
