"use client";

import AuthGuard from "@/components/AuthGuard";
import CafeGame from "@/components/CafeGame";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { db, functions } from "@/lib/firebase";
import { recipes } from "@/lib/recipes";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";

type Profile = { displayName:string; level:number; xp:number; coins:number; popularity:number; role:string };
type Job = { id:string; recipeName:string; recipeId:string; readyAt:any; status:string; revenue:number; xpReward:number };

function GameContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("Bem-vindo ao seu café!");

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), snap => setProfile(snap.data() as Profile));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "cookJobs"), where("ownerId", "==", user.uid));
    return onSnapshot(q, snap => setJobs(snap.docs.map(d => ({ id:d.id, ...d.data() } as Job)).filter(j => j.status !== "collected")));
  }, [user]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const activeJobs = useMemo(() => jobs.sort((a,b) => (a.readyAt?.toMillis?.() ?? 0) - (b.readyAt?.toMillis?.() ?? 0)), [jobs]);

  async function cook(recipeId:string) {
    try {
      setMessage("👨‍🍳 Preparando receita...");
      await httpsCallable(functions, "startRecipe")({ recipeId });
      setMessage("🔥 Receita no fogão! Volte quando estiver pronta.");
    } catch (e:any) { setMessage(`⚠️ ${e.message}`); }
  }

  async function collect(jobId:string) {
    try {
      const result:any = await httpsCallable(functions, "collectRecipe")({ jobId });
      const data:any = result.data;
      setMessage(data.levelReward > 0 ? `🎉 Subiu de nível! Bônus de ${data.levelReward} moedas.` : `🍽️ Prato servido! +${data.coinsGain} moedas.`);
    } catch (e:any) { setMessage(`⚠️ ${e.message}`); }
  }

  const p = profile ?? { displayName:"Chef", level:1, xp:0, coins:0, popularity:50, role:"player" };
  return <div className="app-bg"><TopBar level={p.level} xp={p.xp} coins={p.coins} />
    <main className="game-layout">
      <section className="game-panel">
        <div className="cafe-title"><div><h1>{p.displayName}, este é o seu CaféVille ☕</h1><p>❤️ Popularidade {p.popularity}%</p></div><div className="notice">{message}</div></div>
        <CafeGame />
        <div className="jobs-strip">
          <strong>🔥 Fogões</strong>
          {activeJobs.length === 0 && <span className="muted">Nenhuma receita sendo preparada.</span>}
          {activeJobs.map(job => {
            const remain = Math.max(0, Math.ceil(((job.readyAt?.toMillis?.() ?? now)-now)/1000));
            return <div className="job-pill" key={job.id}><span>{job.recipeName}</span>{remain > 0 ? <b>⏱ {remain}s</b> : <button onClick={() => collect(job.id)}>🍽️ Servir</button>}</div>
          })}
        </div>
      </section>
      <aside className="recipe-panel"><h2>📖 Livro de Receitas</h2><p>Escolha o que colocar no fogão.</p>
        <div className="recipe-list">{recipes.map(r => <article className={`recipe-card ${p.level < r.level ? "locked" : ""}`} key={r.id}>
          <div className="recipe-emoji">{r.emoji}</div><div><h3>{r.name}</h3><small>⏱ {r.seconds}s · 🪙 {r.cost} → {r.revenue} · ⭐ {r.xp} XP</small></div>
          <button disabled={p.level < r.level} onClick={() => cook(r.id)}>{p.level < r.level ? `🔒 Nv. ${r.level}` : "Cozinhar"}</button>
        </article>)}</div>
      </aside>
    </main>
  </div>;
}

export default function GamePage(){ return <AuthGuard><GameContent /></AuthGuard>; }
