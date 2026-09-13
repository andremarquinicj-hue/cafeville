"use client";

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const data = new FormData(e.currentTarget);
    try {
      await signInWithEmailAndPassword(auth, String(data.get("email")), String(data.get("password")));
      router.push("/jogo");
    } catch {
      setError("Não foi possível entrar. Confira seu e-mail e senha.");
    } finally { setLoading(false); }
  }

  return (
    <main className="cv-auth-page">
      <section className="auth-visual">
        <img src="/assets/cafeville-scene.png" alt="CaféVille" />
        <div className="auth-visual-copy"><b> CaféVille</b><span>Cozinhe. Decore. Faça amigos.</span></div>
      </section>
      <form className="cv-auth-card" onSubmit={submit}>
        <div className="auth-brand"><span></span><strong>CaféVille</strong></div>
        <h1>Que bom te ver!</h1><p>Seu café está esperando por você.</p>
        <label>E-mail<input name="email" type="email" required /></label>
        <label>Senha<input name="password" type="password" minLength={6} required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn auth-main-btn" disabled={loading}>{loading ? "Entrando..." : "Entrar no CaféVille"}</button>
        <button className="quiet" type="button" onClick={async e=>{const form=e.currentTarget.form;if(!form)return;const email=String(new FormData(form).get('email')||'');if(!email){setError('Informe seu e-mail no campo acima.');return;}try{await sendPasswordResetEmail(auth,email);setError('Se houver uma conta para este e-mail, você receberá as instruções para recuperar a senha.');}catch{setError('Não foi possível enviar. Confira o e-mail e tente novamente.');}}}>Esqueci minha senha</button>
        <p className="auth-foot">Ainda não joga? <Link href="/cadastro">Criar meu café</Link></p>
      </form>
    </main>
  );
}
