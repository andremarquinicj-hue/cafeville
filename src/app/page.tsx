import Link from "next/link";

export default function Home() {
  return (
    <main className="cv-landing">
      <div className="landing-cloud cloud-a" /><div className="landing-cloud cloud-b" />
      <section className="landing-card">
        <div className="landing-left">
          <img src="/assets/cafeville-login-reference.png" alt="CaféVille" />
        </div>
        <div className="landing-right">
          <div className="landing-logo">☕ <span>CaféVille</span></div>
          <h1>Seu café.<br />Seus amigos.<br /><em>Sua história.</em></h1>
          <p>Abra seu restaurante, prepare receitas, decore cada cantinho, suba no ranking e visite cafés de pessoas do Brasil inteiro.</p>
          <div className="landing-actions"><Link className="primary-btn big" href="/cadastro">Jogar agora</Link><Link className="secondary-btn big" href="/login">Entrar</Link></div>
          <div className="landing-features"><span>🍳 Cozinhe</span><span>🪑 Decore</span><span>👥 Faça amigos</span><span>🏆 Compita</span></div>
          <small>Uma experiência social de navegador inspirada na nostalgia dos jogos de café da era do Orkut, com identidade própria.</small>
        </div>
      </section>
    </main>
  );
}
