"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TopBar({ level = 1, coins = 0, xp = 0 }: { level?: number; coins?: number; xp?: number }) {
  return (
    <header className="topbar">
      <Link href="/jogo" className="brand"><span>☕</span>CaféVille</Link>
      <nav>
        <Link href="/jogo">Meu Café</Link>
        <Link href="/comunidade">Amigos</Link>
        <Link href="/ranking">Ranking</Link>
        <Link href="/admin">Admin</Link>
      </nav>
      <div className="stats-mini">
        <span>⭐ Nv. {level}</span>
        <span>✨ {xp} XP</span>
        <span>🪙 {coins.toLocaleString("pt-BR")}</span>
        <button className="ghost-btn" onClick={() => signOut(auth)}>Sair</button>
      </div>
    </header>
  );
}
