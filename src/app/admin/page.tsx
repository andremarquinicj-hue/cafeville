"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { apiPost } from "@/lib/api";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAt, endAt } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

type Player={uid:string;displayName:string;username:string;level:number;coins:number};
function Admin(){
 const {user}=useAuth(); const [role,setRole]=useState<string|null>(null); const [term,setTerm]=useState(""); const [players,setPlayers]=useState<Player[]>([]); const [msg,setMsg]=useState("");
 useEffect(()=>{if(!user)return;(async()=>{const s=await getDoc(doc(db,"users",user.uid));setRole(s.data()?.role||"player")})()},[user]);
 async function search(e:FormEvent){e.preventDefault();const v=term.trim().toLowerCase();if(!v)return;const q=query(collection(db,"publicProfiles"),orderBy("usernameLower"),startAt(v),endAt(v+"\uf8ff"),limit(20));const s=await getDocs(q);setPlayers(s.docs.map(d=>d.data() as Player));}
 async function grantCoins(uid:string,amount:number){try{await apiPost("/api/admin/grant", {targetUid:uid,type:"coins",amount});setMsg(`✅ ${amount.toLocaleString("pt-BR")} moedas enviadas.`)}catch(e:any){setMsg(`⚠️ ${e.message}`)}}
 async function grantGift(uid:string,giftId:string){try{await apiPost("/api/admin/grant", {targetUid:uid,type:"gift",giftId});setMsg(`🎁 Presente ${giftId} enviado.`)}catch(e:any){setMsg(`⚠️ ${e.message}`)}}
 if(role===null)return <div className="center-screen">Verificando acesso...</div>;
 if(role!=="admin")return <div className="app-bg"><TopBar/><main className="content-shell"><div className="access-denied"><h1>🔐 Painel do Administrador</h1><p>Seu usuário ainda não possui permissão de administrador.</p><p>No primeiro acesso, altere manualmente <code>users/SEU_UID/role</code> para <code>admin</code> no Console do Firebase.</p></div></main></div>;
 return <div className="app-bg"><TopBar/><main className="content-shell"><div className="page-heading"><div><h1>🛡️ Administração CaféVille</h1><p>Envie recompensas aos jogadores. Toda ação fica registrada.</p></div></div>{msg&&<div className="notice big">{msg}</div>}<form className="search-bar" onSubmit={search}><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscar @usuario..."/><button className="primary-btn">Buscar jogador</button></form><div className="admin-list">{players.map(p=><article className="admin-player" key={p.uid}><div><strong>{p.displayName}</strong><p>@{p.username} · Nv. {p.level} · 🪙 {p.coins?.toLocaleString("pt-BR")}</p></div><div className="admin-actions"><button onClick={()=>grantCoins(p.uid,500)}>+500 🪙</button><button onClick={()=>grantCoins(p.uid,5000)}>+5.000 🪙</button><button onClick={()=>grantGift(p.uid,"mesa_vintage")}>🎁 Mesa Vintage</button><button onClick={()=>grantGift(p.uid,"fogao_dourado")}>🎁 Fogão Dourado</button></div></article>)}</div></main></div>
}
export default function AdminPage(){return <AuthGuard><Admin/></AuthGuard>}
