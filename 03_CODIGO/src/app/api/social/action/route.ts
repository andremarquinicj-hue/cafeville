import { NextRequest,NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireUser } from '@/lib/server-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { apiError,safeId,catalogs } from '@/services/server-game';
import { GameError } from '@/game/core/actions';
import { createCafe,stat,awardXp,resetPeriods,periodKeys } from '@/game/core/state';
import { isStyle } from '@/game/core/catalog';
import type { Cafe,Player } from '@/types/game';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),a=await req.json(),db=getAdminDb(),now=Date.now();
 if(a.type==='inbox'){
  const [inbox,campaigns,cafe]=await Promise.all([db.collection(`gifts/${auth.uid}/items`).where('accepted','==',false).limit(50).get(),db.collection('campaigns').where('active','==',true).limit(30).get(),db.doc(`cafes/${auth.uid}`).get()]);
  return NextResponse.json({gifts:[...inbox.docs.map(d=>({...d.data(),id:d.id})),...campaigns.docs.filter(d=>!(cafe.data()?.appliedCampaigns||[]).includes(d.id)).map(d=>({...d.data(),id:`campaign-${d.id}`,fromName:'Equipe CaféVille'}))]});
 }
 if(a.type==='wall'){
  const uid=safeId(a.targetUid),[wall,cafe,profile,liked]=await Promise.all([db.collection(`cafes/${uid}/wall`).orderBy('createdAt','desc').limit(30).get(),db.doc(`cafes/${uid}`).get(),db.doc(`publicProfiles/${uid}`).get(),db.doc(`cafes/${uid}/likes/${auth.uid}`).get()]);
  if(!profile.exists)throw new GameError('Café não encontrado.',404);const cat=await catalogs();
  const raw=cafe.data(),c=raw?.schemaVersion===4?raw:createCafe(uid,raw?.name||profile.data()?.cafeName||'Café',now);
  return NextResponse.json({cafe:{...c,inventory:[],recentActions:[],appliedCampaigns:[]},profile:profile.data(),liked:liked.exists,messages:wall.docs.map(d=>({...d.data(),id:d.id})),now,items:cat.items,recipes:cat.recipes});
 }
 if(a.type==='dismiss'){const target=safeId(a.targetUid);await db.doc(`followSuggestions/${auth.uid}/items/${target}`).delete();return NextResponse.json({ok:true});}
 if(a.type==='accept'){
  const cat=await catalogs();
  const giftId=safeId(a.giftId),campaign=giftId.startsWith('campaign-'),giftRef=campaign?db.doc(`campaigns/${giftId.slice(9)}`):db.doc(`gifts/${auth.uid}/items/${giftId}`);
  await db.runTransaction(async tx=>{
   const cafeRef=db.doc(`cafes/${auth.uid}`),userRef=db.doc(`users/${auth.uid}`),[gift,cs,us]=await Promise.all([tx.get(giftRef),tx.get(cafeRef),tx.get(userRef)]);
   if(!gift.exists||!us.exists||cs.data()?.schemaVersion!==4)throw new GameError('Entre no seu café antes de receber presentes.');
   const c=cs.data() as Cafe,p=us.data() as Player,g=gift.data()!;
   if(g.accepted||campaign&&c.appliedCampaigns.includes(giftId.slice(9)))return;
   if(campaign&&!g.active)throw new GameError('Esta campanha terminou.');
   if(g.itemId){const item=cat.items.find(i=>i.id===g.itemId);if(!item)throw new GameError('Item do presente indisponível.');if(isStyle(item.kind)){if(!c.ownedStyles.includes(item.id))c.ownedStyles.push(item.id);}else{if(c.inventory.length>=400)throw new GameError('Seu inventário está cheio.');c.inventory.push({id:`gift-${giftId}`,itemId:g.itemId});}}
   const amount=Number(g.coins||0);if(!Number.isSafeInteger(amount)||amount<0||amount>1000000)throw new GameError('Presente inválido.');p.coins+=amount;
   if(campaign)c.appliedCampaigns.push(giftId.slice(9));else tx.update(giftRef,{accepted:true,acceptedAt:FieldValue.serverTimestamp()});c.revision++;
   tx.set(cafeRef,c,{merge:true});tx.update(userRef,{coins:p.coins});tx.set(db.doc(`publicProfiles/${auth.uid}`),{coins:p.coins},{merge:true});
   tx.set(db.doc(`giftReceipts/${auth.uid}_${giftId}`),{uid:auth.uid,giftId,coins:amount,itemId:g.itemId||null,createdAt:FieldValue.serverTimestamp()});
  });return NextResponse.json({ok:true});
 }
 const target=safeId(a.targetUid);if(target===auth.uid)throw new GameError('Escolha o café de outro jogador.');
 const targetRef=db.doc(`cafes/${target}`),myRef=db.doc(`cafes/${auth.uid}`),userRef=db.doc(`users/${auth.uid}`);
 await db.runTransaction(async tx=>{
  const [other,mine,user,targetUser]=await Promise.all([tx.get(targetRef),tx.get(myRef),tx.get(userRef),tx.get(db.doc(`users/${target}`))]);
  if(!other.exists||!user.exists||!targetUser.exists||targetUser.data()?.disabled)throw new GameError('Jogador indisponível.');
  const at=FieldValue.serverTimestamp();
  if(a.type==='like'){
   const ref=db.doc(`cafes/${target}/likes/${auth.uid}`),old=await tx.get(ref);if(!old.exists){tx.create(ref,{uid:auth.uid,createdAt:at});tx.update(targetRef,{likes:FieldValue.increment(1)});}return;
  }
  if(a.type==='message'){
   const text=String(a.text||'').trim();if(text.length<2||text.length>300)throw new GameError('Escreva de 2 a 300 caracteres.');
   const requestId=safeId(a.requestId),ref=db.doc(`cafes/${target}/wall/${auth.uid}_${requestId}`),existing=await tx.get(ref);if(existing.exists)return;
   if(now-(user.data()?.lastWallAt||0)<30000)throw new GameError('Aguarde alguns segundos para enviar outro recado.');
   tx.create(ref,{uid:auth.uid,displayName:user.data()?.displayName,text,createdAt:at});tx.update(userRef,{lastWallAt:now});return;
  }
  if(a.type==='gift'){
   const requestId=safeId(a.requestId),ref=db.doc(`gifts/${target}/items/${auth.uid}_${requestId}`),existing=await tx.get(ref);if(existing.exists)return;
   if(mine.data()?.schemaVersion!==4)throw new GameError('Entre no seu café primeiro.');
   const c=mine.data() as Cafe,item=c.inventory.find(i=>i.id===a.inventoryId);if(!item)throw new GameError('Escolha um item guardado no seu inventário.');
   c.inventory=c.inventory.filter(i=>i.id!==item.id);c.revision++;tx.set(myRef,c,{merge:true});
   tx.create(ref,{fromUid:auth.uid,fromName:user.data()?.displayName,itemId:item.itemId,title:'Um presente para o seu café',coins:0,accepted:false,createdAt:at});return;
  }
  if(a.type==='help'){
   if(mine.data()?.schemaVersion!==4||other.data()?.schemaVersion!==4)throw new GameError('Os dois cafés precisam abrir a nova versão primeiro.');
   const key=periodKeys(now).day,ref=db.doc(`socialHelps/${auth.uid}_${target}_${key}`),old=await tx.get(ref);if(old.exists)throw new GameError('Você já ajudou este café hoje.');
   const c=mine.data() as Cafe,p={gems:0,...user.data()} as Player;
   resetPeriods(c,p,now);stat(c,'helped');awardXp(p,5);c.revision++;
   tx.create(ref,{uid:auth.uid,targetUid:target,createdAt:at});tx.set(myRef,c,{merge:true});tx.update(targetRef,{dirty:{}});
   const patch={coins:p.coins,xp:p.xp,level:p.level,gems:p.gems,totalXp:p.totalXp||0,weekKey:p.weekKey,weekScore:p.weekScore||0};tx.update(userRef,patch);tx.set(db.doc(`publicProfiles/${auth.uid}`),patch,{merge:true});return;
  }
  throw new GameError('Ação social inválida.');
 });return NextResponse.json({ok:true});
}catch(e){return apiError(e);}}
