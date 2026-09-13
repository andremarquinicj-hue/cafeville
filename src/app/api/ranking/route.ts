import { NextRequest,NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { apiError } from '@/services/server-game';
import { periodKeys } from '@/game/core/state';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),a=await req.json(),db=getAdminDb();let players:any[]=[];
 if(a.mode==='friends'){
  const following=await db.collection('follows').where('followerUid','==',auth.uid).limit(200).get();
  const ids=[auth.uid,...following.docs.map(d=>String(d.data().targetUid))];const profiles=await db.getAll(...ids.map(id=>db.doc(`publicProfiles/${id}`)));players=profiles.filter(p=>p.exists).map(p=>p.data());players.sort((a,b)=>b.level-a.level||b.xp-a.xp);
 }else{
  const profiles=db.collection('publicProfiles');const q=a.mode==='week'?profiles.where('weekKey','==',periodKeys(Date.now()).week).orderBy('weekScore','desc'):a.mode==='popularity'?profiles.orderBy('popularity','desc'):profiles.orderBy('level','desc').orderBy('xp','desc');
  const snap=await q.limit(50).get();players=snap.docs.map(d=>d.data());
 }
 return NextResponse.json({players:players.filter(p=>!p.disabled).slice(0,50)});
}catch(e){return apiError(e);}}
