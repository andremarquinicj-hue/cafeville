import { NextRequest,NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/server-auth';
import { createCafe,periodKeys } from '@/game/core/state';
import { RECIPES,ITEMS } from '@/game/core/catalog';
import { advance } from '@/game/core/simulation';
import { applyAction,GameError } from '@/game/core/actions';
import type { Cafe,Player,Action,Item,Recipe,SeasonalEvent } from '@/types/game';
export const safeId=(v:unknown):string=>{if(typeof v!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(v))throw new GameError('Identificador inválido.');return v;};
export function apiError(error:unknown){
 if(error instanceof GameError)return NextResponse.json({error:error.message},{status:error.status});
 if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Entre na sua conta para continuar.'},{status:401});
 console.error('CaféVille API',error instanceof Error?error.message:'Unknown error');
 return NextResponse.json({error:'Não foi possível salvar. Confira a conexão e tente novamente.'},{status:500});
}
let catalogCache:{until:number;items:Item[];recipes:Recipe[];events:SeasonalEvent[]}|null=null;
export function clearCatalogCache(){catalogCache=null;}
export async function catalogs(){
 if(catalogCache&&catalogCache.until>Date.now())return catalogCache;
 const db=getAdminDb();const [itemDocs,recipeDocs,eventDocs]=await Promise.all(['gameItems','gameRecipes','events'].map(x=>db.collection(x).limit(100).get()));
 const merge=<T extends {id:string}>(base:T[],extra:T[])=>Array.from(new Map([...base,...extra].map(x=>[x.id,x])).values());
 return catalogCache={until:Date.now()+30000,items:merge(ITEMS,itemDocs.docs.map(d=>({...d.data(),id:d.id} as Item))),recipes:merge(RECIPES,recipeDocs.docs.map(d=>({...d.data(),id:d.id} as Recipe))),events:eventDocs.docs.map(d=>({...d.data(),id:d.id} as SeasonalEvent))};
}
export async function gameRequest(req:NextRequest,forcedType?:string){
 try{
  const auth=await requireUser(req);const raw=await req.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new GameError('Pedido inválido.');
  const a={...raw,...(forcedType?{type:forcedType}:{})} as Action;
  const isRead=['state','pulse'].includes(a.type);
  if(!isRead)safeId(a.requestId);
  const db=getAdminDb(),cat=await catalogs(),now=Date.now();
  const userRef=db.doc(`users/${auth.uid}`),cafeRef=db.doc(`cafes/${auth.uid}`);
  const receiptRef=db.doc(`gameRequests/${auth.uid}_${a.requestId||randomUUID()}`);
  const result=await db.runTransaction(async tx=>{
   const [u,cs,receipt]=await Promise.all([tx.get(userRef),tx.get(cafeRef),...(!isRead?[tx.get(receiptRef)]:[])]);
   if(!u.exists)throw new GameError('Conclua seu perfil para abrir o café.',409);
   if(u.data()?.disabled)throw new GameError('Conta desativada.',403);
   const p={gems:0,...u.data(),uid:auth.uid} as Player;
   const migrate=cs.data()?.schemaVersion!==4;
   // Migration reads precede every transaction write and never reset the user profile.
   const inventory=migrate?await tx.get(db.collection(`inventories/${auth.uid}/items`).limit(200)):null;
   const c=migrate?{...createCafe(auth.uid,cs.data()?.name||p.cafeName||`Café de ${p.displayName.split(' ')[0]}`,now),totalVisits:cs.data()?.totalVisits||0,likes:cs.data()?.likes||0}:cs.data() as Cafe;
   if(inventory)for(const d of inventory.docs){const itemId=String(d.data().itemId||'');if(cat.items.some(i=>i.id===itemId))for(let i=0;i<Math.min(20,Number(d.data().quantity)||1);i++)c.inventory.push({id:`legacy-${d.id}-${i}`,itemId});}
   if(receipt?.exists)return {player:p,cafe:c,now,message:'Esta ação já foi concluída.'};
   if(a.type==='pulse'&&!migrate&&now-c.sim.at<2500)return {player:p,cafe:c,now,message:''};
   advance(c,p,now,cat.items);
   const before={coins:p.coins,level:p.level,xp:p.xp};
   const message=applyAction(c,p,a,now,cat.items,cat.recipes,cat.events);c.revision++;
   tx.set(cafeRef,c,{merge:true});
   const patch={coins:p.coins,xp:p.xp,level:p.level,gems:p.gems||0,popularity:p.popularity,totalXp:p.totalXp||0,weekKey:p.weekKey||periodKeys(now).week,weekScore:p.weekScore||0,lastSeenAt:FieldValue.serverTimestamp()};
   tx.update(userRef,patch);tx.set(db.doc(`publicProfiles/${auth.uid}`),{...patch,cafeName:c.name},{merge:true});
   if(!isRead)tx.create(receiptRef,{uid:auth.uid,type:a.type,before,after:{coins:p.coins,level:p.level,xp:p.xp},createdAt:FieldValue.serverTimestamp()});
   return {player:p,cafe:c,now,message};
  });
  let legacyJobs;
  if(a.type==='state'){
   const jobs=await db.collection('cookJobs').where('ownerId','==',auth.uid).where('status','==','cooking').limit(100).get();
   legacyJobs=jobs.docs.map(d=>({id:d.id,recipeName:d.data().recipeName,readyAt:d.data().readyAt?.toMillis?.()||0,revenue:d.data().revenue||0}));
  }
  return NextResponse.json({...result,items:cat.items,recipes:cat.recipes,events:cat.events,...(legacyJobs?{legacyJobs}:{})},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return apiError(error);}
}
