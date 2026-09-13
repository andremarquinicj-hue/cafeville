"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { auth, functions } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const data = new FormData(e.currentTarget);
    const displayName = String(data.get("displayName") ?? "").trim();
    const username = String(data.get("username") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const bootstrap = httpsCallable(functions, "bootstrapPlayer");
      await bootstrap({ displayName, username });
      router.push("/jogo");
    } catch (err: any) {
      setError(err?.message?.replace("FirebaseError: ", "") || "Não foi possível criar a conta.");
    } finally { setLoading(false); }
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <div className="mini-logo">☕ CaféVille</div><h1>Abra seu café</h1><p>Você começará com <strong>3.000 moedas</strong>.</p>
    <label>Seu nome<input name="displayName" placeholder="Ex.: André Marquini" minLength={2} required /></label>
    <label>Usuário<input name="username" placeholder="Ex.: andre.cafe" minLength={3} maxLength={18} pattern="[A-Za-z0-9._-]+" required /></label>
    <label>E-mail<input name="email" type="email" required /></label>
    <label>Senha<input name="password" type="password" minLength={6} required /></label>
    {error && <div className="error-box">{error}</div>}
    <button className="primary-btn" disabled={loading}>{loading ? "Criando café..." : "Começar a jogar"}</button>
    <p className="auth-foot">Já tem conta? <Link href="/login">Entrar</Link></p>
  </form></main>;
}
