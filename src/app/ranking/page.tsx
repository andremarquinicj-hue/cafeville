"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

type P={uid:string;displayName:string;username:string;level:number;xp:number;popularity:number;cafeName:string};
function Ranking(){
 const [players,setPlayers]=useState<P[]>([]);
 useEffect(()=>{(async()=>{const q=query(collection(db,"publicProfiles"),orderBy("level","desc"),orderBy("xp","desc"),limit(50));const s=await getDocs(q);setPlayers(s.docs.map(d=>d.data() as P));})()},[]);
 return <div className="app-bg"><TopBar/><main className="content-shell"><div className="page-heading"><div><h1>🏆 Ranking CaféVille</h1><p>Os cafés mais avançados da comunidade.</p></div></div><div className="ranking-card">{players.map((p,i)=><Link href={`/jogador/${p.uid}`} className="rank-row" key={p.uid}><span className="rank-pos">{i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}</span><span className="rank-name"><strong>{p.displayName}</strong><small>@{p.username} · {p.cafeName}</small></span><span>⭐ Nv. {p.level}</span><span>✨ {p.xp} XP</span><span>❤️ {p.popularity}%</span></Link>)}</div></main></div>
}
export default function RankingPage(){return <AuthGuard><Ranking/></AuthGuard>}
