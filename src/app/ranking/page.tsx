"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

type P = { uid:string;displayName:string;username:string;level:number;xp:number;popularity:number;cafeName:string;followersCount?:number };

function Ranking() {
  const [players, setPlayers] = useState<P[]>([]);
  useEffect(() => { (async () => {
    const q = query(collection(db, "publicProfiles"), orderBy("level", "desc"), orderBy("xp", "desc"), limit(50));
    const s = await getDocs(q); setPlayers(s.docs.map(d => d.data() as P));
  })(); }, []);

  return <div className="cv-app-bg"><TopBar />
    <main className="ranking-shell-v3">
      <section className="ranking-hero"><div><span className="eyebrow">🏆 CAFÉVILLE</span><h1>Ranking dos Cafés</h1><p>Suba de nível, sirva receitas e conquiste seu espaço entre os melhores cafés.</p></div><div className="trophy-big">🏆</div></section>
      <div className="podium">
        {[1,0,2].map((idx, place) => { const p=players[idx]; if(!p)return <div className="podium-slot empty" key={idx}/>; const medal=idx===0?"🥇":idx===1?"🥈":"🥉"; return <Link href={`/jogador/${p.uid}`} className={`podium-slot p${idx+1}`} key={p.uid}><span className="podium-medal">{medal}</span><div className="podium-avatar">☕</div><strong>{p.displayName}</strong><small>@{p.username}</small><b>⭐ Nv. {p.level}</b></Link>})}
      </div>
      <section className="ranking-table-v3">
        <div className="ranking-head"><span>Posição</span><span>Jogador</span><span>Nível</span><span>Popularidade</span><span>Seguidores</span></div>
        {players.map((p,i)=><Link href={`/jogador/${p.uid}`} className="ranking-row-v3" key={p.uid}><span className="rank-num">{i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}</span><span className="rank-player"><b>{p.displayName}</b><small>@{p.username} · {p.cafeName}</small></span><span>⭐ {p.level}</span><span>❤️ {p.popularity}%</span><span>👥 {p.followersCount || 0}</span></Link>)}
      </section>
    </main>
  </div>;
}

export default function RankingPage() { return <AuthGuard><Ranking /></AuthGuard>; }
