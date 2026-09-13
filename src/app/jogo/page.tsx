"use client";

import AuthGuard from "@/components/AuthGuard";
import CafeGame from "@/components/CafeGame";
import GameSidebar from "@/components/GameSidebar";
import InviteModal from "@/components/InviteModal";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/lib/api";
import { db } from "@/lib/firebase";
import { recipes } from "@/lib/recipes";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type Profile = {
  displayName: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  popularity: number;
  role: string;
  followersCount?: number;
  followingCount?: number;
};

type Job = { id: string; recipeName: string; recipeId: string; readyAt: any; status: string; revenue: number; xpReward: number };

type PanelKey = "recipes" | "store" | "staff" | "decor" | "missions";

const storeItems = [
  ["🪵", "Mesa Rústica", 300], ["🪑", "Cadeira Bistro", 150], ["🛋️", "Sofá Conforto", 1200],
  ["🪴", "Planta Verde", 250], ["💡", "Luminária Vintage", 400], ["🧰", "Balcão de Madeira", 800],
];

const staff = [
  ["👨‍🍳", "Chef", "Prepara receitas no fogão", 600],
  ["🧑‍💼", "Garçom", "Atende os clientes nas mesas", 400],
  ["🧹", "Faxineira", "Mantém o café sempre limpo", 300],
];

function GameContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("Bem-vindo ao seu café!");
  const [panel, setPanel] = useState<PanelKey>("recipes");
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), snap => setProfile(snap.data() as Profile));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "cookJobs"), where("ownerId", "==", user.uid));
    return onSnapshot(q, snap => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)).filter(j => j.status !== "collected")));
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeJobs = useMemo(
    () => [...jobs].sort((a, b) => (a.readyAt?.toMillis?.() ?? 0) - (b.readyAt?.toMillis?.() ?? 0)),
    [jobs]
  );

  async function cook(recipeId: string) {
    try {
      setMessage("👨‍🍳 Preparando receita...");
      await apiPost("/api/recipes/start", { recipeId });
      setMessage("🔥 Receita no fogão! Volte quando estiver pronta.");
    } catch (e: any) {
      setMessage(`⚠️ ${e.message}`);
    }
  }

  async function collect(jobId: string) {
    try {
      const data: any = await apiPost("/api/recipes/collect", { jobId });
      setMessage(data.levelReward > 0
        ? `🎉 Subiu de nível! Bônus de ${data.levelReward.toLocaleString("pt-BR")} moedas.`
        : `🍽️ Prato servido! +${data.coinsGain.toLocaleString("pt-BR")} moedas.`);
    } catch (e: any) {
      setMessage(`⚠️ ${e.message}`);
    }
  }

  const p = profile ?? {
    displayName: "Chef", username: "jogador", level: 1, xp: 0, coins: 0, popularity: 50, role: "player"
  };
  const xpGoal = Math.max(100, p.level * 100);
  const xpPct = Math.min(100, Math.round((p.xp / xpGoal) * 100));

  return (
    <div className="cv-app-bg">
      <TopBar />
      <main className="cv-game-shell">
        <GameSidebar active={panel} onChange={(key) => setPanel(key as PanelKey)} onInvite={() => setInviteOpen(true)} />

        <section className="cv-center-stage">
          <div className="player-float-card">
            <div className="player-avatar">👩‍🍳</div>
            <div className="player-float-info">
              <strong>{p.displayName}</strong>
              <span>@{p.username || "jogador"}</span>
              <div className="mini-progress"><i style={{ width: `${xpPct}%` }} /></div>
              <small>⭐ Nível {p.level} · {p.xp}/{xpGoal} XP</small>
            </div>
          </div>

          <div className="scene-message">{message}</div>
          <CafeGame activeJobCount={activeJobs.length} onOpenRecipes={() => setPanel("recipes")} />

          <div className="cook-strip">
            <div className="cook-strip-title"><span>🔥</span><b>Fogões</b></div>
            {activeJobs.length === 0 && <span className="cook-empty">Nenhuma receita sendo preparada.</span>}
            {activeJobs.map(job => {
              const remain = Math.max(0, Math.ceil(((job.readyAt?.toMillis?.() ?? now) - now) / 1000));
              return (
                <div className="cook-job" key={job.id}>
                  <span>🍳 {job.recipeName}</span>
                  {remain > 0 ? <b>⏱ {remain}s</b> : <button onClick={() => collect(job.id)}>🍽️ Servir</button>}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="cv-right-panel">
          {panel === "recipes" && (
            <>
              <div className="panel-title-row"><h2>👨‍🍳 Receitas</h2><button onClick={() => setPanel("store")}>🛒</button></div>
              <div className="panel-tabs"><button className="active">Todas</button><button>Bebidas</button><button>Pratos</button><button>Doces</button></div>
              <div className="recipe-grid-v3">
                {recipes.map(r => (
                  <article className={`recipe-tile ${p.level < r.level ? "locked" : ""}`} key={r.id}>
                    <div className="recipe-art">{r.emoji}</div>
                    <h3>{r.name}</h3>
                    <div className="recipe-meta"><span>⏱ {r.seconds}s</span><span>🪙 {r.cost}</span><span>⭐ {r.xp}</span></div>
                    <small>Venda: 🪙 {r.revenue}</small>
                    <button disabled={p.level < r.level} onClick={() => cook(r.id)}>{p.level < r.level ? `🔒 Nível ${r.level}` : "Cozinhar"}</button>
                  </article>
                ))}
              </div>
              <div className="chef-tip"><span>👩‍🍳</span><p><b>Dica da Chef:</b><br />Sirva pratos variados para manter seus clientes felizes!</p></div>
            </>
          )}

          {panel === "store" && (
            <>
              <div className="panel-title-row"><h2>🛍️ Loja</h2><span className="panel-balance">🪙 {p.coins.toLocaleString("pt-BR")}</span></div>
              <div className="panel-tabs"><button className="active">Móveis</button><button>Decoração</button><button>Pisos</button><button>Paredes</button></div>
              <div className="shop-grid">
                {storeItems.map(([emoji, name, price]) => (
                  <article className="shop-item" key={String(name)}>
                    <div>{emoji}</div><strong>{name}</strong><span>🪙 {Number(price).toLocaleString("pt-BR")}</span>
                    <button onClick={() => setMessage("🛠️ Compra e posicionamento de móveis entram na próxima etapa.")}>+</button>
                  </article>
                ))}
              </div>
              <div className="panel-note">🌿 Deixe seu café com a sua cara!</div>
            </>
          )}

          {panel === "staff" && (
            <>
              <div className="panel-title-row"><h2>👥 Funcionários</h2></div>
              <div className="staff-list">
                {staff.map(([emoji, name, desc, cost], i) => (
                  <article className="staff-row" key={String(name)}>
                    <div className="staff-avatar">{emoji}</div>
                    <div><strong>{name}</strong><small>{desc}</small><span>Nível {i === 0 ? 3 : 1}</span></div>
                    <button onClick={() => setMessage("👥 Melhorias de funcionários serão liberadas na próxima atualização.")}>Melhorar<br /><b>🪙 {cost}</b></button>
                  </article>
                ))}
                <article className="staff-row locked-staff"><div className="staff-avatar">🧑‍🍳</div><div><strong>Ajudante de Cozinha</strong><small>Desbloqueia no nível 15</small></div><button disabled>🔒</button></article>
              </div>
            </>
          )}

          {panel === "decor" && (
            <>
              <div className="panel-title-row"><h2>🪑 Decoração</h2></div>
              <div className="decor-preview">
                <div className="decor-room">🪴　🖼️　💡<br />🛋️　🪵　🌿<br />🧺　☕　🌷</div>
                <h3>Modo de edição</h3>
                <p>Em breve você poderá arrastar, girar, guardar e vender os móveis dentro do café.</p>
                <button className="primary-btn" onClick={() => setMessage("🎨 Modo decoração está sendo preparado.")}>Entrar no modo decoração</button>
              </div>
            </>
          )}

          {panel === "missions" && (
            <>
              <div className="panel-title-row"><h2>🎯 Missões</h2></div>
              <div className="panel-tabs"><button className="active">Diárias</button><button>Semanais</button><button>Especiais</button></div>
              <div className="mission-list">
                <div className="mission"><span>✅</span><div><strong>Sirva 20 clientes</strong><div className="mission-bar"><i style={{width:"40%"}} /></div><small>8 / 20</small></div><b>🪙 100</b></div>
                <div className="mission"><span>🍳</span><div><strong>Cozinhe 5 receitas</strong><div className="mission-bar"><i style={{width:"40%"}} /></div><small>2 / 5</small></div><b>🪙 150</b></div>
                <div className="mission"><span>🪴</span><div><strong>Decore com 3 itens novos</strong><div className="mission-bar"><i style={{width:"33%"}} /></div><small>1 / 3</small></div><b>🪙 200</b></div>
                <div className="mission"><span>👥</span><div><strong>Visite 3 cafés de amigos</strong><div className="mission-bar"><i style={{width:"0%"}} /></div><small>0 / 3</small></div><b>🪙 100</b></div>
              </div>
            </>
          )}
        </aside>
      </main>

      <nav className="mobile-dock">
        <button onClick={() => setPanel("recipes")}>📖<span>Receitas</span></button>
        <button onClick={() => setPanel("store")}>🛍️<span>Loja</span></button>
        <button onClick={() => location.href = "/comunidade"}>👥<span>Amigos</span></button>
        <button onClick={() => setInviteOpen(true)}>🎁<span>Convidar</span></button>
      </nav>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

export default function GamePage() {
  return <AuthGuard><GameContent /></AuthGuard>;
}
