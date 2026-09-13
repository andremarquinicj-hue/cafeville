"use client";

import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { apiPost } from "@/lib/api";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("convite") || "";
    setInviteCode(code.trim().toUpperCase());
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const displayName = String(data.get("displayName") ?? "").trim();
    const username = String(data.get("username") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    let created = false;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      created = true;
      await apiPost("/api/bootstrap", { displayName, username, inviteCode });
      router.push("/jogo");
    } catch (err: any) {
      if (created && auth.currentUser) {
        try { await deleteUser(auth.currentUser); } catch {}
      }
      const raw = err?.message || "Não foi possível criar a conta.";
      const friendly = raw.includes("email-already-in-use")
        ? "Esse e-mail já possui uma conta no CaféVille."
        : raw.includes("weak-password")
          ? "Escolha uma senha com pelo menos 6 caracteres."
          : raw.replace("FirebaseError: ", "");
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cv-auth-page">
      <section className="auth-visual">
        <img src="/assets/cafeville-login-reference.png" alt="CaféVille" />
        <div className="auth-visual-copy"><b>☕ CaféVille</b><span>Seu café, mais amigos!</span></div>
      </section>
      <form className="cv-auth-card" onSubmit={submit}>
        <div className="auth-brand"><span>☕</span><strong>CaféVille</strong></div>
        <h1>Abra seu café</h1>
        <p>Comece pequeno, cozinhe, decore e faça amigos.</p>
        {inviteCode && <div className="invite-welcome">🎁 Convite <b>{inviteCode}</b> aplicado! Você começa com <strong>3.250 moedas</strong>.</div>}
        <label>Seu nome<input name="displayName" placeholder="Ex.: André Marquini" minLength={2} required /></label>
        <label>Usuário<input name="username" placeholder="Ex.: andre.cafe" minLength={3} maxLength={18} pattern="[A-Za-z0-9._-]+" required /></label>
        <label>E-mail<input name="email" type="email" required /></label>
        <label>Senha<input name="password" type="password" minLength={6} required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn auth-main-btn" disabled={loading}>{loading ? "Criando seu café..." : "Jogar agora"}</button>
        <p className="auth-foot">Já tem conta? <Link href="/login">Entrar</Link></p>
      </form>
    </main>
  );
}
