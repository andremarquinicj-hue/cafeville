import type { Cafe, Player, Stats, Progress } from '@/types/game';
export const emptyStats = (): Stats => ({ served:0,cooked:0,bought:0,earned:0,visits:0,helped:0 });
export function periodKeys(now:number) {
 const d=new Date(now-3*3600000), day=d.toISOString().slice(0,10);
 const monday=new Date(`${day}T00:00:00Z`); monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
 return {day,week:monday.toISOString().slice(0,10)};
}
export function createCafe(uid:string,name:string,now:number):Cafe {
 const layout=[['fogao_classico',1,1],['fogao_classico',2,1],['geladeira',0,0],['balcao_madeira',1,3],['balcao_madeira',2,3],['balcao_madeira',3,3],['mesa_rustica',5,2],['cadeira_bistro',5,3],['mesa_rustica',6,4],['cadeira_bistro',6,5],['mesa_rustica',3,5],['cadeira_bistro',3,6],['mesa_rustica',1,5],['cadeira_bistro',1,6],['planta_verde',7,0],['planta_verde',7,6]];
 return {ownerId:uid,name,schemaVersion:4,revision:0,size:8,layout:layout.map(([itemId,x,y],i)=>({id:`starter-${i}`,itemId:String(itemId),x:Number(x),y:Number(y),rotation:0})),inventory:[],ownedStyles:['piso_madeira','parede_creme','porta_madeira','janela_azul','tema_jardim'],styles:{floor:'piso_madeira',wall:'parede_creme',door:'porta_madeira',window:'janela_azul',theme:'tema_jardim'},jobs:[],counters:{},dirty:{},staff:{chef:1,waiter:1,cleaner:1},open:true,sim:{at:now,nextArrival:now+5000,sequence:0,customers:[],workers:[]},progress:{...periodKeys(now),daily:emptyStats(),weekly:emptyStats(),total:emptyStats(),claimed:[]},branch:'main',totalVisits:0,likes:0,appliedCampaigns:[],recentActions:[]};
}
export function resetPeriods(c:Cafe,p:Player,now:number) {
 const k=periodKeys(now);
 if(c.progress.day!==k.day){c.progress.day=k.day;c.progress.daily=emptyStats();}
 if(c.progress.week!==k.week){c.progress.week=k.week;c.progress.weekly=emptyStats();}
 c.progress.claimed=c.progress.claimed.filter(x=>x.startsWith('total:')||x.startsWith(`daily:${k.day}:`)||x.startsWith(`weekly:${k.week}:`));
 if(p.weekKey!==k.week){p.weekKey=k.week;p.weekScore=0;}
}
export function stat(c:Cafe,key:keyof Stats,n=1){for(const p of ['daily','weekly','total'] as const)c.progress[p][key]+=n;}
export function awardXp(p:Player,amount:number){
 p.xp+=amount;p.totalXp=(p.totalXp||0)+amount;p.weekScore=(p.weekScore||0)+amount;
 while(p.xp>=p.level*100){p.xp-=p.level*100;p.level++;p.coins+=500+p.level*100;p.gems=(p.gems||0)+1;}
}
export function missionKey(progress:Progress,period:'daily'|'weekly'|'total',id:string){return `${period}:${period==='daily'?progress.day:period==='weekly'?progress.week:'all'}:${id}`;}
