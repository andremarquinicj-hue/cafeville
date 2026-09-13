"use client";

import AuthGuard from "@/components/AuthGuard";
import InviteModal from "@/components/InviteModal";
import TopBar from "@/components/TopBar";
import { apiPost } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, endAt, getDocs, limit, orderBy, query, startAt } from "firebase/firestore";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type PublicProfile = {
  uid: string; displayName: string; username: string; level: number; coins: number; popularity: number; cafeName: string; avatar: string;
  followersCount?: number; followingCount?: number; reason?: string;
};

type Tab = "discover" | "following" | "followers" | "suggestions";

function CommunityContent() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [tab, setTab] = useState<Tab>("suggestions");
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  async function loadList(mode: Tab) {
    setTab(mode);
    if (mode === "discover") { setResults([]); return; }
    setLoading(true);
    try {
      const data = await apiPost<{ players: PublicProfile[] }>("/api/social/list", { mode });
      setResults(data.players || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadList("suggestions"); }, []);

  async function search(e: FormEvent) {
    e.preventDefault();
    const value = term.trim().toLowerCase().replace(/^@/, "");
    if (!value) return;
    setTab("discover"); setLoading(true);
    try {
      const q = query(collection(db, "publicProfiles"), orderBy("usernameLower"), startAt(value), endAt(value + "\uf8ff"), limit(24));
      const snap = await getDocs(q);
      setResults(snap.docs.map(d => d.data() as PublicProfile));
    } finally { setLoading(false); }
  }

  async function follow(p: PublicProfile) {
    await apiPost("/api/social/follow", { targetUid: p.uid, action: "follow" });
    if (tab === "suggestions") setResults(prev => prev.filter(x => x.uid !== p.uid));
  }

  return (
    <div className="cv-app-bg community-bg"><TopBar />
      <main className="social-shell">
        <section className="social-hero">
          <div><span className="eyebrow">👥 COMUNIDADE</span><h1>Amigos e vizinhos</h1><p>Encontre jogadores, siga cafés que você gosta e acompanhe quem entrou pelo seu convite.</p></div>
          <button className="gift-invite-button" onClick={() => setInviteOpen(true)}>🎁 Convidar amigos</button>
        </section>

        <div className="social-tabs">
          <button className={tab === "suggestions" ? "active" : ""} onClick={() => loadList("suggestions")}>✨ Sugestões</button>
          <button className={tab === "following" ? "active" : ""} onClick={() => loadList("following")}>💚 Seguindo</button>
          <button className={tab === "followers" ? "active" : ""} onClick={() => loadList("followers")}>☕ Seguidores</button>
          <button className={tab === "discover" ? "active" : ""} onClick={() => loadList("discover")}>🔎 Descobrir</button>
        </div>

        <form className="social-search" onSubmit={search}><span>🔎</span><input value={term} onChange={e => setTerm(e.target.value)} placeholder="Buscar por @usuario..." /><button>Buscar</button></form>

        {loading ? <div className="social-empty">☕ Carregando cafés...</div> : (
          <div className="social-grid">
            {results.map(p => <article className="social-card" key={p.uid}>
              <div className="social-card-cover"><div className="mini-cafe-art">🪴　☕<br />🪑🍰🪑</div></div>
              <div className="social-card-body">
                <div className="social-avatar">{p.avatar || "☕"}</div>
                <h3>{p.displayName}</h3><p>@{p.username}</p>
                {p.reason && <div className="reason-badge">🎁 {p.reason}</div>}
                <div className="social-stats"><span>⭐ Nv. {p.level}</span><span>❤️ {p.popularity}%</span><span>👥 {p.followersCount || 0}</span></div>
                <strong>{p.cafeName}</strong>
                <div className="social-actions"><Link href={`/jogador/${p.uid}`}>Visitar café</Link>{tab === "suggestions" && <button onClick={() => follow(p)}>+ Seguir</button>}</div>
              </div>
            </article>)}
            {results.length === 0 && <div className="social-empty wide">{tab === "suggestions" ? "Nenhuma sugestão por enquanto. Convide um amigo para jogar com você!" : "Nenhum jogador encontrado nesta lista."}</div>}
          </div>
        )}
      </main>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

export default function CommunityPage() { return <AuthGuard><CommunityContent /></AuthGuard>; }
