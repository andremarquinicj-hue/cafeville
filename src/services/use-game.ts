"use client";
import { useEffect,useRef,useState,useCallback } from 'react';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { createCafe } from '@/game/core/state';
import { advance } from '@/game/core/simulation';
import { applyAction } from '@/game/core/actions';
import { ITEMS,RECIPES } from '@/game/core/catalog';
import type { GameState,Action } from '@/types/game';
const DEMO_KEY='cafeville-demo-v4';
function demoState():GameState{const now=Date.now();return {now,player:{uid:'demo',displayName:'Chef André',username:'meu.cafe',role:'player',level:1,xp:0,coins:3000,gems:0,popularity:50},cafe:createCafe('demo','O seu primeiro café',now),items:ITEMS,recipes:RECIPES,events:[]};}
export function useGame(demo=false){
 const {user}=useAuth(),[state,setState]=useState<GameState|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('Clique em um fogão e escolha sua primeira receita.'),[error,setError]=useState(''),[online,setOnline]=useState(true),[levelUp,setLevelUp]=useState(0);
 const current=useRef<GameState|null>(null),lock=useRef(false),pending=useRef<Action|null>(null),active=useRef(true);
 const accept=useCallback((data:GameState)=>{if(!active.current)return;const previous=current.current;if(previous&&data.cafe.revision<previous.cafe.revision)return;if(previous&&data.player.level>previous.player.level)setLevelUp(data.player.level);const next={...data,legacyJobs:data.legacyJobs??previous?.legacyJobs};current.current=next;setState(next);setError('');},[]);
 const execute=useCallback(async(action:Action)=>{
  if(demo){const next=structuredClone(current.current||demoState());next.now=Date.now();advance(next.cafe,next.player,next.now,next.items);const msg=applyAction(next.cafe,next.player,action,next.now,next.items,next.recipes,next.events);next.cafe.revision++;localStorage.setItem(DEMO_KEY,JSON.stringify(next));return {...next,message:msg};}
  return apiPost<GameState&{message?:string}>('/api/game',action);
 },[demo]);
 const run=useCallback(async(action:Action)=>{
  if(lock.current)return false;lock.current=true;setBusy(true);
  try{const a=pending.current||{...action,requestId:crypto.randomUUID()};pending.current=a;if(!demo&&user)sessionStorage.setItem(`cv-pending-${user.uid}`,JSON.stringify(a));const data=await execute(a);pending.current=null;if(user)sessionStorage.removeItem(`cv-pending-${user.uid}`);accept(data);setMessage(data.message||'Salvo.');return true;
  }catch(e){const message=e instanceof Error?e.message:'Não foi possível concluir.';setMessage(message);if(!/fetch|network|conexão|salvar/i.test(message)){pending.current=null;if(user)sessionStorage.removeItem(`cv-pending-${user.uid}`);}return false;}
  finally{lock.current=false;setBusy(false);}
 },[demo,user,execute,accept]);
 useEffect(()=>{active.current=true;if(!demo&&!user)return;
  let cancelled=false;
  (async()=>{try{
   if(demo){try{const saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(saved?.cafe?.schemaVersion===4)current.current=saved;}catch{}}
   else if(user){try{pending.current=JSON.parse(sessionStorage.getItem(`cv-pending-${user.uid}`)||'null');}catch{}}
   const data=await execute({type:'state'});if(!cancelled)accept(data);
   if(pending.current&&!cancelled)await run(pending.current);
  }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Não foi possível carregar.');}})();
  const timer=setInterval(async()=>{if(lock.current||document.hidden||!navigator.onLine||!current.current)return;lock.current=true;try{const data=await execute({type:'pulse'});if(!cancelled)accept(data);}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Conexão interrompida.');}finally{lock.current=false;}},4000);
  const network=()=>setOnline(navigator.onLine);window.addEventListener('online',network);window.addEventListener('offline',network);network();
  return()=>{cancelled=true;active.current=false;clearInterval(timer);window.removeEventListener('online',network);window.removeEventListener('offline',network);};
 },[demo,user,execute,accept,run]);
 return {state,busy,message,setMessage,error,online,run,levelUp,setLevelUp,refresh:async()=>accept(await execute({type:'state'}))};
}
