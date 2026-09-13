import { NextRequest,NextResponse } from 'next/server';
import { FieldValue,AggregateField } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireUser } from '@/lib/server-auth';
import { apiError,safeId,catalogs,clearCatalogCache } from '@/services/server-game';
import { GameError } from '@/game/core/actions';
import { ITEMS } from '@/game/core/catalog';
export const runtime='nodejs';
const number=(v:unknown,min:number,max:number)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)throw new GameError(`Valor fora da faixa ${min} a ${max}.`);return n;};
const str=(v:unknown,max=80)=>{const s=String(v||'').trim();if(s.length<2||s.length>max)throw new GameError('Confira o tamanho dos textos.');return s;};
export async function POST(req:NextRequest){try{
 const auth=await requireUser(req),db=getAdminDb(),admin=await db.doc(`users/${auth.uid}`).get();
 if(admin.data()?.role!=='admin')throw new GameError('Acesso exclusivo do administrador.',403);
 const a=await req.json(),cat=await catalogs();
 if(a.type==='dashboard'){
  const [totals,logs,events,campaigns]=await Promise.all([db.collection('users').aggregate({players:AggregateField.count(),coins:AggregateField.sum('coins')}).get(),db.collection('adminLogs').orderBy('createdAt','desc').limit(50).get(),db.collection('events').limit(100).get(),db.collection('campaigns').limit(100).get()]);
  return NextResponse.json({totals:totals.data(),logs:logs.docs.map(d=>({...d.data(),id:d.id})),events:events.docs.map(d=>({...d.data(),id:d.id})),campaigns:campaigns.docs.map(d=>({...d.data(),id:d.id})),items:cat.items,recipes:cat.recipes});
 }
 if(a.type==='search'){
  const term=String(a.term||'').trim().toLowerCase().replace(/^@/,'');if(!term||term.length>80)throw new GameError('Informe um usuário ou e-mail.');
  const users=term.includes('@')?await db.collection('users').where('email','==',term).limit(20).get():await db.collection('users').orderBy('username').startAt(term).endAt(term+'\uf8ff').limit(20).get();
  return NextResponse.json({players:users.docs.map(d=>({...d.data(),uid:d.id}))});
 }
 const requestId=safeId(a.requestId),logRef=db.doc(`adminLogs/${auth.uid}_${requestId}`),at=FieldValue.serverTimestamp();
 let targetUid='',payload:Record<string,unknown>={},collection='',docId='';
 if(['coins','gift','disable'].includes(a.type))targetUid=safeId(a.targetUid);
 if(a.type==='coins')payload={amount:number(a.amount,1,1000000)};
 else if(a.type==='gift'){const item=cat.items.find(i=>i.id===a.itemId);if(!item||['floor','wall','door','window','theme'].includes(item.kind))throw new GameError('Escolha um móvel ou decoração.');payload={itemId:item.id,title:`Presente: ${item.name}`};}
 else if(a.type==='disable'){if(targetUid===auth.uid)throw new GameError('Não é possível desativar a própria conta.');if(typeof a.disabled!=='boolean')throw new GameError('Estado inválido.');payload={disabled:a.disabled};}
 else if(a.type==='campaign'){
  collection='campaigns';docId=requestId;const item=cat.items.find(i=>i.id===a.itemId);if(a.itemId&&!item)throw new GameError('Item inválido.');
  payload={title:str(a.title),coins:number(a.coins,0,1000000),itemId:item?.id||null,active:true,createdAt:at};
 }
 else if(a.type==='recipe'){
  collection='gameRecipes';docId=safeId(a.id);const art=cat.recipes.find(r=>r.id===a.artId)?.art;if(!art)throw new GameError('Escolha uma arte do livro de receitas.');
  if(!['Bebidas','Salgados','Doces','Pratos'].includes(a.category))throw new GameError('Categoria inválida.');
  payload={id:docId,name:str(a.name),category:a.category,cost:number(a.cost,1,100000),price:number(a.price,1,1000),portions:number(a.portions,1,10000),xp:number(a.xp,1,10000),seconds:number(a.seconds,5,604800),shelfSeconds:number(a.shelfSeconds,60,1209600),level:number(a.level,1,100),art,active:a.active!==false};
 }
 else if(a.type==='item'){
  collection='gameItems';docId=safeId(a.id);const template=ITEMS.find(i=>i.id===a.templateId);if(!template)throw new GameError('Escolha o modelo visual.');const old=cat.items.find(i=>i.id===docId);
  if(old&&(old.kind!==template.kind||old.width!==template.width||old.height!==template.height))throw new GameError('Não altere o tipo ou tamanho de um item existente. Crie outro identificador.');
  payload={...template,id:docId,name:str(a.name),price:number(a.price,1,100000),level:number(a.level,1,100),active:a.active!==false};
 }
 else if(a.type==='event'){
  collection='events';docId=safeId(a.id);const startAt=number(a.startAt,0,9999999999999),endAt=number(a.endAt,startAt+60000,9999999999999);
  if(a.itemId&&!cat.items.some(i=>i.id===a.itemId))throw new GameError('Item do evento inválido.');
  if(a.recipeId&&!cat.recipes.some(r=>r.id===a.recipeId))throw new GameError('Receita do evento inválida.');
  payload={id:docId,name:str(a.name),description:str(a.description,300),startAt,endAt,target:number(a.target,1,100000),coins:number(a.coins,0,1000000),xp:number(a.xp,0,10000),active:a.active!==false,itemId:a.itemId||null,recipeId:a.recipeId||null};
 }else throw new GameError('Operação administrativa inválida.');
 await db.runTransaction(async tx=>{
  const [log,target]=await Promise.all([tx.get(logRef),...(targetUid?[tx.get(db.doc(`users/${targetUid}`))]:[])]);if(log.exists)return;if(targetUid&&!target?.exists)throw new GameError('Jogador não encontrado.',404);
  if(a.type==='coins'){
   const coins=Number(target!.data()?.coins||0)+Number(payload.amount);tx.update(target!.ref,{coins});tx.set(db.doc(`publicProfiles/${targetUid}`),{coins},{merge:true});
  }else if(a.type==='gift')tx.create(db.doc(`gifts/${targetUid}/items/admin-${requestId}`),{...payload,fromName:'Equipe CaféVille',fromUid:auth.uid,coins:0,accepted:false,createdAt:at});
  else if(a.type==='disable'){tx.update(target!.ref,payload);tx.set(db.doc(`publicProfiles/${targetUid}`),payload,{merge:true});}
  else tx.set(db.doc(`${collection}/${docId}`),payload,{merge:true});
  tx.create(logRef,{adminUid:auth.uid,type:a.type,targetUid:targetUid||docId,payload,createdAt:at});
 });clearCatalogCache();return NextResponse.json({ok:true});
}catch(e){return apiError(e);}}
