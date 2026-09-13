"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query, startAt, endAt } from "firebase/firestore";
import Link from "next/link";
import { FormEvent, useState } from "react";

type PublicProfile = { uid:string; displayName:string; username:string; level:number; coins:number; popularity:number; cafeName:string; avatar:string };

function CommunityContent(){
  const [term,setTerm]=useState("");
  const [results,setResults]=useState<PublicProfile[]>([]);
  const [searched,setSearched]=useState(false);

  async function search(e:FormEvent){
    e.preventDefault();
    const value=term.trim().toLowerCase();
    if(!value) return;
    const q=query(collection(db,"publicProfiles"),orderBy("usernameLower"),startAt(value),endAt(value+"\uf8ff"),limit(20));
    const snap=await getDocs(q);
    setResults(snap.docs.map(d=>d.data() as PublicProfile));
    setSearched(true);
  }

  return <div className="app-bg"><TopBar/><main className="content-shell">
    <div className="page-heading"><div><h1>👥 Comunidade CaféVille</h1><p>Encontre jogadores pelo nome de usuário e visite seus cafés.</p></div></div>
    <form className="search-bar" onSubmit={search}><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Buscar @usuario..."/><button className="primary-btn">Buscar</button></form>
    <div className="players-grid">
      {results.map(p=><article className="player-card" key={p.uid}><div className="avatar">{p.avatar||"☕"}</div><h3>{p.displayName}</h3><p>@{p.username}</p><div className="player-stats"><span>⭐ Nv. {p.level}</span><span>❤️ {p.popularity}%</span></div><strong>{p.cafeName}</strong><Link className="secondary-btn" href={`/jogador/${p.uid}`}>Visitar café</Link></article>)}
      {searched&&results.length===0&&<div className="empty-card">Nenhum jogador encontrado.</div>}
    </div>
  </main></div>
}
export default function CommunityPage(){return <AuthGuard><CommunityContent/></AuthGuard>}
