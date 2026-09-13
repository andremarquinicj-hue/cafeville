"use client";

import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { apiPost } from "@/lib/api";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Data = { profile: any; cafe: any };

function Visit() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [data, setData] = useState<Data | null>(null);
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const [p, c] = await Promise.all([getDoc(doc(db, "publicProfiles", uid)), getDoc(doc(db, "cafes", uid))]);
      setData({ profile: p.data(), cafe: c.data() });
      try { await apiPost("/api/visit", { targetUid: uid }); } catch {}
      try { const status: any = await apiPost("/api/social/status", { targetUid: uid }); setFollowing(!!status.following); } catch {}
    })();
  }, [uid]);

  async function toggleFollow() {
    try {
      const next = !following;
      await apiPost("/api/social/follow", { targetUid: uid, action: next ? "follow" : "unfollow" });
      setFollowing(next);
      setMessage(next ? "💚 Você agora segue este café." : "Você deixou de seguir este café.");
    } catch (e:any) { setMessage(e.message); }
  }

  if (!data?.profile) return <div className="center-screen">☕ Carregando café...</div>;
  const p = data.profile, c = data.cafe;

  return <div className="cv-app-bg"><TopBar />
    <main className="visit-shell-v3">
      <section className="visit-profile-card">
        <div className="visit-avatar-v3">{p.avatar || "☕"}</div>
        <div><span className="eyebrow">VISITANDO</span><h1>{c?.name || p.cafeName}</h1><p>de <b>{p.displayName}</b> · @{p.username}</p></div>
        <div className="visit-stat-stack"><span>⭐ Nível {p.level}</span><span>❤️ {p.popularity}%</span><span>👀 {c?.totalVisits || 0} visitas</span><span>👥 {p.followersCount || 0} seguidores</span></div>
      </section>

      {message && <div className="visit-message">{message}</div>}
      <section className="friend-scene-card"><img src="/assets/cafeville-scene.png" alt={`Café de ${p.displayName}`} /><div className="visitor-bubble">👋 Você está visitando!</div></section>

      <section className="visit-action-bar">
        <button onClick={toggleFollow}>{following ? "✓ Seguindo" : "💚 Seguir café"}</button>
        <button onClick={() => setMessage("❤️ Você curtiu este café!")}>❤️ Curtir</button>
        <button onClick={() => setMessage("🎁 Loja de presentes entra na próxima atualização.")}>🎁 Enviar presente</button>
        <button onClick={() => setMessage("💬 Mural de recados entra na próxima atualização.")}>💬 Mensagem</button>
      </section>
    </main>
  </div>;
}

export default function PlayerPage() { return <AuthGuard><Visit /></AuthGuard>; }
