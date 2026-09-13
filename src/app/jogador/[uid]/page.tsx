"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { db } from "@/lib/firebase";
import { apiPost } from "@/lib/api";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Data={profile:any;cafe:any};
function Visit(){
 const params=useParams<{uid:string}>(); const uid=params.uid; const [data,setData]=useState<Data|null>(null);
 useEffect(()=>{if(!uid)return;(async()=>{const [p,c]=await Promise.all([getDoc(doc(db,"publicProfiles",uid)),getDoc(doc(db,"cafes",uid))]);setData({profile:p.data(),cafe:c.data()});try{await apiPost("/api/visit", {targetUid:uid})}catch{}})()},[uid]);
 if(!data?.profile)return <div className="center-screen">☕ Carregando café...</div>;
 const p=data.profile,c=data.cafe;
 return <div className="app-bg"><TopBar/><main className="content-shell"><div className="visit-hero"><div className="visit-avatar">{p.avatar||"☕"}</div><div><h1>{c?.name||p.cafeName}</h1><p>de <strong>{p.displayName}</strong> · @{p.username}</p><div className="visit-stats"><span>⭐ Nível {p.level}</span><span>❤️ Popularidade {p.popularity}%</span><span>👀 {c?.totalVisits||0} visitas</span></div></div></div><section className="friend-cafe"><div className="friend-floor">🌿 🪴 🪑 🍰 ☕ 👨‍🍳 🍕 🧑‍💼 🪑 🌷<br/>🪴 🪑 ☕ 🍪 👩 🍽️ 🪑 🌿 🧁 ☕</div><p>Na próxima etapa, esta área carregará exatamente os móveis e a decoração salvos pelo dono do café.</p></section><div className="friend-actions"><button>❤️ Curtir</button><button>🎁 Enviar presente</button><button>💬 Deixar recado</button></div></main></div>
}
export default function PlayerPage(){return <AuthGuard><Visit/></AuthGuard>}
