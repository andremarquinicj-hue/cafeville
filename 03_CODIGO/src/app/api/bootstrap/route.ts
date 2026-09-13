import { NextRequest,NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { normalizeUsername,START_COINS,INVITEE_BONUS,INVITER_BONUS } from '@/lib/game-server';
import { requireUser } from '@/lib/server-auth';
import { createCafe,periodKeys } from '@/game/core/state';
import { apiError } from '@/services/server-game';
import { GameError } from '@/game/core/actions';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),body=await req.json(),displayName=String(body.displayName||'').trim(),username=normalizeUsername(String(body.username||'')),referralCode=String(body.inviteCode||'').trim().toUpperCase();
 if(displayName.length<2||displayName.length>30||username.length<3||username.length>18)throw new GameError('Confira seu nome (2–30 caracteres) e usuário (3–18).');
 if(referralCode&&!/^[A-Z0-9-]{3,40}$/.test(referralCode))throw new GameError('Código de convite inválido.');
 const db=getAdminDb(),now=Date.now(),ownCode=`${username.replace(/[^a-z0-9]/g,'').slice(0,8).toUpperCase()}-${randomBytes(6).toString('hex').toUpperCase()}`;
 const result=await db.runTransaction(async tx=>{
  const userRef=db.doc(`users/${auth.uid}`),nameRef=db.doc(`usernames/${username}`),inviteRef=db.doc(`inviteCodes/${ownCode}`);
  const [existing,taken,code,referral]=await Promise.all([tx.get(userRef),tx.get(nameRef),tx.get(inviteRef),...(referralCode?[tx.get(db.doc(`inviteCodes/${referralCode}`))]:[])]);
  if(existing.exists)return {startCoins:existing.data()?.coins||0,inviteBonus:0,existing:true};
  if(taken.exists)throw new GameError('Esse nome de usuário já está em uso.',409);
  if(code.exists)throw new GameError('Tente concluir o cadastro novamente.',409);
  const inviterUid=String(referral?.data()?.uid||'');
  const inviter=inviterUid?await tx.get(db.doc(`users/${inviterUid}`)):null;
  if(referralCode&&(!inviter?.exists||inviterUid===auth.uid||inviter.data()?.disabled))throw new GameError('Convite inválido ou indisponível. Remova o código para continuar.');
  const coins=START_COINS+(inviter?INVITEE_BONUS:0),at=FieldValue.serverTimestamp(),cafeName=`Café de ${displayName.split(' ')[0]}`;
  const common={uid:auth.uid,displayName,username,level:1,xp:0,totalXp:0,coins,gems:0,popularity:50,followersCount:0,followingCount:0,referralCount:0,weekKey:periodKeys(now).week,weekScore:0,createdAt:at};
  tx.create(userRef,{...common,email:auth.email||null,role:'player',inviteCode:ownCode,referredBy:inviter?inviterUid:null,lastSeenAt:at});
  tx.set(db.doc(`publicProfiles/${auth.uid}`),{...common,displayNameLower:displayName.toLowerCase(),usernameLower:username,cafeName,avatar:'chef'});
  tx.create(nameRef,{uid:auth.uid,createdAt:at});tx.create(inviteRef,{uid:auth.uid,username,createdAt:at});
  tx.set(db.doc(`cafes/${auth.uid}`),createCafe(auth.uid,cafeName,now));
  if(inviter){
   const patch={coins:Number(inviter.data()?.coins||0)+INVITER_BONUS,referralCount:Number(inviter.data()?.referralCount||0)+1};
   tx.update(inviter.ref,patch);tx.set(db.doc(`publicProfiles/${inviterUid}`),patch,{merge:true});
   tx.create(db.doc(`inviteEvents/${auth.uid}`),{inviterUid,invitedUid:auth.uid,inviteCode:referralCode,inviterBonus:INVITER_BONUS,inviteeBonus:INVITEE_BONUS,createdAt:at});
   tx.set(db.doc(`followSuggestions/${auth.uid}/items/${inviterUid}`),{targetUid:inviterUid,reason:'Você entrou pelo convite deste jogador. Deseja seguir o café dele?',createdAt:at});
   tx.set(db.doc(`followSuggestions/${inviterUid}/items/${auth.uid}`),{targetUid:auth.uid,reason:`${displayName} entrou pelo seu convite. Deseja seguir o café dele?`,createdAt:at});
  }
  return {startCoins:coins,inviteBonus:inviter?INVITEE_BONUS:0,existing:false};
 });return NextResponse.json({ok:true,...result});
}catch(e){return apiError(e);}}
