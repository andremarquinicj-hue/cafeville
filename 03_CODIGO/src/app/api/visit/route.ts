import { NextRequest,NextResponse } from 'next/server';
import { FieldValue,Timestamp } from 'firebase-admin/firestore';
import { requireUser } from '@/lib/server-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { apiError,safeId } from '@/services/server-game';
import { GameError } from '@/game/core/actions';
import { periodKeys,resetPeriods,stat } from '@/game/core/state';
import type { Cafe,Player } from '@/types/game';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),a=await req.json(),target=safeId(a.targetUid);if(target===auth.uid)return NextResponse.json({ok:true});
 const db=getAdminDb(),now=Date.now();await db.runTransaction(async tx=>{
  const ref=db.doc(`cafes/${target}/visitors/${auth.uid}`),targetRef=db.doc(`cafes/${target}`),myRef=db.doc(`cafes/${auth.uid}`);
  const [old,other,mine,user]=await Promise.all([tx.get(ref),tx.get(targetRef),tx.get(myRef),tx.get(db.doc(`users/${auth.uid}`))]);if(!other.exists)throw new GameError('Café não encontrado.',404);
  const day=periodKeys(now).day;if(old.data()?.day===day)return;
  tx.set(ref,{visitorId:auth.uid,lastVisitAt:Timestamp.fromMillis(now),day,count:FieldValue.increment(1)},{merge:true});tx.update(targetRef,{totalVisits:FieldValue.increment(1)});
  if(mine.data()?.schemaVersion===4&&user.exists){const c=mine.data() as Cafe,p=user.data() as Player;resetPeriods(c,p,now);stat(c,'visits');c.revision++;tx.set(myRef,c,{merge:true});}
 });return NextResponse.json({ok:true});
}catch(e){return apiError(e);}}
