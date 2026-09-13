"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

type Profile = { level?: number; xp?: number; coins?: number; popularity?: number; role?: string; displayName?: string };

export default function TopBar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "users", user.uid), snap => setProfile((snap.data() as Profile) || {}));
  }, [user]);

  return (
    <header className="cv-topbar">
      <Link href="/jogo" className="cv-logo" aria-label="CaféVille">
        <span className="cv-logo-cup">☕</span>
        <span className="cv-logo-word">Café<span>Ville</span></span>
      </Link>

      <nav className="cv-main-nav">
        <Link href="/jogo">Meu Café</Link>
        <Link href="/comunidade">Amigos</Link>
        <Link href="/ranking">Ranking</Link>
        {profile.role === "admin" && <Link href="/admin">Admin</Link>}
      </nav>

      <div className="cv-hud">
        <div className="hud-chip level"><b>⭐</b><span>Nv. {profile.level ?? 1}</span></div>
        <div className="hud-chip coins"><b>🪙</b><span>{Number(profile.coins ?? 0).toLocaleString("pt-BR")}</span></div>
        <div className="hud-chip heart"><b>❤️</b><span>{profile.popularity ?? 50}%</span></div>
        <button className="cv-icon-btn" title="Sair" onClick={() => signOut(auth)}>↪</button>
      </div>
    </header>
  );
}
