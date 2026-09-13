import type { Action,Cafe,Player,Item,Recipe,SeasonalEvent,Furniture } from '@/types/game';
import { EXPANSIONS,ITEMS,RECIPES,MISSIONS,isStyle } from './catalog';
import { access,entry,validLayout } from './grid';
import { awardXp,stat,missionKey } from './state';
import { resetSimulation } from './simulation';
export class GameError extends Error { constructor(message:string,public status=400){super(message);} }
const ensure=(ok:unknown,message:string):void=>{if(!ok)throw new GameError(message);};
const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)?v:'';
export function applyAction(c:Cafe,p:Player,a:Action,now:number,items:Item[]=ITEMS,recipes:Recipe[]=RECIPES,events:SeasonalEvent[]=[]):string{
 const spend=(coins:number)=>{ensure(Number.isSafeInteger(coins)&&coins>=0&&p.coins>=coins,'Moedas insuficientes.');p.coins-=coins;};
 const item=items.find(i=>i.id===id(a.itemId));
 const find=()=>{const f=c.layout.find(f=>f.id===id(a.id));ensure(f,'Móvel não encontrado.');return f!;};
 const protect=(f:Furniture)=>{ensure(!c.jobs.some(j=>j.stoveId===f.id),'Recolha ou limpe a receita antes de guardar o fogão.');ensure(!(c.counters[f.id]?.portions>0),'Esvazie o balcão antes de guardá-lo.');};
 const commitLayout=(layout:Furniture[])=>{const error=validLayout({...c,layout},items);ensure(!error,error||'Posição inválida.');resetSimulation(c,now);c.layout=layout;};
 if(a.type==='pulse'||a.type==='state')return '';
 if(a.type==='cook'){
  const r=recipes.find(r=>r.id===a.recipeId&&r.active!==false);ensure(r,'Receita indisponível.');ensure(p.level>=r!.level,`Esta receita exige nível ${r!.level}.`);
  const stove=a.stoveId?c.layout.find(f=>f.id===id(a.stoveId)):c.layout.find(f=>items.find(i=>i.id===f.itemId)?.kind==='stove'&&!c.jobs.some(j=>j.stoveId===f.id));
  ensure(stove&&items.find(i=>i.id===stove.itemId)?.kind==='stove','Posicione um fogão livre.');ensure(!c.jobs.some(j=>j.stoveId===stove!.id),'Esse fogão já está ocupado.');
  ensure(access(c,stove!,entry(c.size),items),'O chef não consegue chegar ao fogão.');spend(r!.cost);
  const seconds=Math.ceil(r!.seconds/(1+(c.staff.chef-1)*.05));
  c.jobs.push({id:`cook-${id(a.requestId)}`,stoveId:stove!.id,recipe:{...r!},startedAt:now,readyAt:now+seconds*1000,spoilsAt:now+(seconds+r!.shelfSeconds)*1000});return 'Receita no fogão!';
 }
 if(a.type==='collect'||a.type==='cleanStove'){
  const job=c.jobs.find(j=>j.id===a.jobId||j.stoveId===a.stoveId);ensure(job,'Preparo não encontrado.');
  if(a.type==='cleanStove'){ensure(now>=job!.spoilsAt,'Este fogão não precisa de limpeza.');c.jobs=c.jobs.filter(j=>j.id!==job!.id);return 'Fogão limpo. Pronto para uma nova receita.';}
  ensure(now>=job!.readyAt,'A receita ainda está preparando.');ensure(now<job!.spoilsAt,'A comida estragou. Limpe o fogão.');
  const counters=c.layout.filter(f=>items.find(i=>i.id===f.itemId)?.kind==='counter');
  const target=counters.find(f=>c.counters[f.id]?.recipeId===job!.recipe.id)||counters.find(f=>!c.counters[f.id]||c.counters[f.id].portions===0);
  ensure(target,'Coloque um balcão vazio ou termine de servir um dos pratos.');
  const r=job!.recipe,stock=c.counters[target!.id];c.counters[target!.id]={recipeId:r.id,name:r.name,portions:(stock?.recipeId===r.id?stock.portions:0)+r.portions,price:r.price,art:r.art};
  c.jobs=c.jobs.filter(j=>j.id!==job!.id);stat(c,'cooked');awardXp(p,r.xp);return `${r.portions} porções de ${r.name} no balcão!`;
 }
 if(a.type==='buy'){
  ensure(item&&item.active!==false,'Item indisponível.');ensure(p.level>=item!.level,`Item liberado no nível ${item!.level}.`);ensure(c.inventory.length+c.layout.length<400,'Seu inventário está cheio.');
  if(isStyle(item!.kind)){ensure(!c.ownedStyles.includes(item!.id),'Você já possui esse acabamento.');spend(item!.price);c.ownedStyles.push(item!.id);}else{spend(item!.price);c.inventory.push({id:`owned-${id(a.requestId)}`,itemId:item!.id});}
  stat(c,'bought');return 'Compra feita! Seu item está no inventário.';
 }
 if(a.type==='place'){
  const f=c.inventory.find(f=>f.id===id(a.id));ensure(f,'Esse item não está no seu inventário.');
  commitLayout([...c.layout,{...f!,x:Number(a.x),y:Number(a.y),rotation:Number(a.rotation||0)}]);c.inventory=c.inventory.filter(i=>i.id!==f!.id);return 'Móvel posicionado e salvo.';
 }
 if(a.type==='move'||a.type==='rotate'){
  const f=find();const updated={...f,x:a.type==='move'?Number(a.x):f.x,y:a.type==='move'?Number(a.y):f.y,rotation:a.type==='rotate'?(f.rotation+1)%4:f.rotation};
  commitLayout(c.layout.map(x=>x.id===f.id?updated:x));return 'Posição salva.';
 }
 if(a.type==='store'||a.type==='sell'){
  const f=c.layout.find(f=>f.id===id(a.id)),stored=c.inventory.find(f=>f.id===id(a.id));ensure(f||stored,'Item não encontrado.');
  if(f){resetSimulation(c,now);protect(f);commitLayout(c.layout.filter(i=>i.id!==f.id));delete c.counters[f.id];}
  const owned=(f||stored)!;
  if(a.type==='sell'){const definition=items.find(i=>i.id===owned.itemId);ensure(definition,'Este item antigo precisa ser atualizado antes de vender.');p.coins+=Math.floor(definition!.price*.4);c.inventory=c.inventory.filter(i=>i.id!==owned.id);return 'Item vendido por 40% do valor da loja.';}
  ensure(f,'O item já está guardado.');c.inventory.push({id:f!.id,itemId:f!.itemId});return 'Item guardado.';
 }
 if(a.type==='style'){ensure(item&&isStyle(item.kind)&&c.ownedStyles.includes(item.id),'Compre esse acabamento primeiro.');c.styles[item!.kind as keyof Cafe['styles']]=item!.id;return 'Novo visual aplicado.';}
 if(a.type==='expand'){
  const expansion=EXPANSIONS.find(e=>e.size>c.size);ensure(expansion,'Seu café já está no tamanho máximo.');ensure(p.level>=expansion!.level,`Expansão liberada no nível ${expansion!.level}.`);spend(expansion!.cost);resetSimulation(c,now);c.size=expansion!.size;return 'Seu café ganhou mais espaço!';
 }
 if(a.type==='upgrade'){
  const role=a.role as keyof Cafe['staff'];ensure(['chef','waiter','cleaner'].includes(role),'Funcionário inválido.');ensure(c.staff[role]<5,'Funcionário no nível máximo.');spend(c.staff[role]*400);c.staff[role]++;return 'Funcionário melhorado!';
 }
 if(a.type==='mission'){
  const m=MISSIONS.find(m=>m.id===a.missionId);ensure(m,'Missão não encontrada.');const k=missionKey(c.progress,m!.period,m!.id);ensure(!c.progress.claimed.includes(k),'Recompensa já recebida.');ensure(c.progress[m!.period][m!.stat]>=m!.target,'Continue jogando para concluir essa missão.');
  c.progress.claimed.push(k);p.coins+=m!.coins;awardXp(p,m!.xp);if(m!.itemId)c.inventory.push({id:`reward-${id(a.requestId)}`,itemId:m!.itemId});return 'Recompensa da missão recebida!';
 }
 if(a.type==='event'){
  const event=events.find(e=>e.id===a.eventId&&e.active&&e.startAt<=now&&e.endAt>now);ensure(event,'Evento indisponível.');
  const k=`event-${event!.id}`;ensure(!c.appliedCampaigns.includes(k),'Recompensa já recebida.');ensure(c.progress.weekly.served>=event!.target,'Atenda mais clientes nesta semana.');
  c.appliedCampaigns.push(k);p.coins+=event!.coins;awardXp(p,event!.xp);if(event!.itemId){const item=items.find(i=>i.id===event!.itemId);if(item&&isStyle(item.kind)){if(!c.ownedStyles.includes(item.id))c.ownedStyles.push(item.id);}else c.inventory.push({id:`event-${id(a.requestId)}`,itemId:event!.itemId});}return 'Recompensa do evento recebida!';
 }
 if(a.type==='open'){ensure(typeof a.open==='boolean','Estado inválido.');resetSimulation(c,now);c.open=a.open as boolean;return c.open?'Portas abertas!':'Café fechado para novos atendimentos.';}
 if(a.type==='rename'){const name=String(a.name||'').trim();ensure(name.length>=3&&name.length<=32,'Use entre 3 e 32 caracteres.');c.name=name;p.cafeName=name;return 'Nome do café atualizado.';}
 throw new GameError('Ação desconhecida.');
}
