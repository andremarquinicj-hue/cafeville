"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, doc, endAt, getDoc, getDocs, limit, orderBy, query, startAt } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

type Player = { uid:string;displayName:string;username:string;level:number;coins:number;followersCount?:number };

function Admin() {
  const { user } = useAuth();
  const [role, setRole] = useState<string|null>(null);
  const [term, setTerm] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => { if(!user)return; (async()=>{ const s=await getDoc(doc(db,"users",user.uid)); setRole(s.data()?.role||"player"); })(); }, [user]);

  async function search(e:FormEvent){e.preventDefault();const v=term.trim().toLowerCase().replace(/^@/,"");if(!v)return;const q=query(collection(db,"publicProfiles"),orderBy("usernameLower"),startAt(v),endAt(v+"\uf8ff"),limit(20));const s=await getDocs(q);setPlayers(s.docs.map(d=>d.data() as Player));}
  async function grantCoins(uid:string,amount:number){try{await apiPost("/api/admin/grant",{targetUid:uid,type:"coins",amount});setMsg(`✅ ${amount.toLocaleString("pt-BR")} moedas enviadas.`)}catch(e:any){setMsg(`⚠️ ${e.message}`)}}
  async function grantGift(uid:string,giftId:string){try{await apiPost("/api/admin/grant",{targetUid:uid,type:"gift",giftId});setMsg(`🎁 Presente enviado com sucesso.`)}catch(e:any){setMsg(`⚠️ ${e.message}`)}}

  if(role===null)return <div className="center-screen">Verificando acesso...</div>;
  if(role!=="admin")return <div className="cv-app-bg"><TopBar/><main className="admin-shell-v3"><div className="access-card"><span>🔐</span><h1>Painel do Administrador</h1><p>Seu usuário ainda não possui permissão de administrador.</p><code>users/SEU_UID/role = admin</code></div></main></div>;

  return <div className="cv-app-bg"><TopBar/><main className="admin-shell-v3">
    <section className="admin-hero"><div><span className="eyebrow">🛡️ CONTROLE CAFÉVILLE</span><h1>Painel do Administrador</h1><p>Envie moedas, presentes e acompanhe os jogadores sem interferir na economia normal do jogo.</p></div><div className="admin-shield">☕</div></section>
    {msg&&<div className="admin-message">{msg}</div>}
    <form className="admin-search" onSubmit={search}><span>🔎</span><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscar @usuario..."/><button>Buscar jogador</button></form>
    <div className="admin-grid-v3">{players.map(p=><article className="admin-player-v3" key={p.uid}><div className="admin-player-avatar">☕</div><div className="admin-player-main"><strong>{p.displayName}</strong><p>@{p.username}</p><div><span>⭐ Nv. {p.level}</span><span>🪙 {Number(p.coins||0).toLocaleString("pt-BR")}</span><span>👥 {p.followersCount||0}</span></div></div><div className="admin-actions-v3"><button onClick={()=>grantCoins(p.uid,500)}>+500 🪙</button><button onClick={()=>grantCoins(p.uid,5000)}>+5.000 🪙</button><button onClick={()=>grantGift(p.uid,"mesa_vintage")}>🎁 Mesa Vintage</button><button onClick={()=>grantGift(p.uid,"fogao_dourado")}>🎁 Fogão Dourado</button></div></article>)}</div>
  </main></div>;
}

export default function AdminPage(){return <AuthGuard><Admin/></AuthGuard>}
