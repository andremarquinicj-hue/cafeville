import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <section className="hero-card">
        <div className="logo-cup">☕</div>
        <h1>CaféVille</h1>
        <p className="tagline">Seu café, seus amigos, sua história.</p>
        <div className="hero-cafe">🏡 🌿 🪑 🍰 ☕ 🌷</div>
        <p>Construa seu café, prepare receitas, receba clientes e visite os cafés dos seus amigos.</p>
        <div className="hero-actions">
          <Link className="primary-btn" href="/cadastro">Criar meu café</Link>
          <Link className="secondary-btn" href="/login">Já tenho conta</Link>
        </div>
        <small>Inspirado na era dos jogos sociais de navegador, com identidade própria.</small>
      </section>
    </main>
  );
}
