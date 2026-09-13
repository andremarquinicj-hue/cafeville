import { NextRequest,NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/server-auth';
import { apiError } from '@/services/server-game';
import { GameError } from '@/game/core/actions';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),db=getAdminDb(),proposed=`CAFE-${randomBytes(8).toString('hex').toUpperCase()}`;
 const inviteCode=await db.runTransaction(async tx=>{
  const ref=db.doc(`users/${auth.uid}`),codeRef=db.doc(`inviteCodes/${proposed}`),[user,code]=await Promise.all([tx.get(ref),tx.get(codeRef)]);
  if(!user.exists)throw new GameError('Conclua seu perfil primeiro.');if(user.data()?.inviteCode)return user.data()!.inviteCode;
  if(code.exists)throw new GameError('Tente novamente.');tx.update(ref,{inviteCode:proposed});tx.create(codeRef,{uid:auth.uid,createdAt:FieldValue.serverTimestamp()});return proposed;
 });return NextResponse.json({inviteCode});
}catch(e){return apiError(e);}}
