"use client";

const items = [
  ["🏠", "Loja", "store"],
  ["📖", "Receitas", "recipes"],
  ["👨‍🍳", "Funcionários", "staff"],
  ["🪑", "Decoração", "decor"],
  ["🎯", "Missões", "missions"],
] as const;

type Props = { active: string; onChange: (key: string) => void; onInvite: () => void };

export default function GameSidebar({ active, onChange, onInvite }: Props) {
  return (
    <aside className="game-sidebar">
      {items.map(([icon, label, key]) => (
        <button key={key} className={active === key ? "active" : ""} onClick={() => onChange(key)}>
          <span className="side-icon">{icon}</span>
          <span>{label}</span>
          {key === "missions" && <em>3</em>}
        </button>
      ))}
      <div className="side-spacer" />
      <button className="friends-btn" onClick={() => location.href = "/comunidade"}><span className="side-icon">🏡</span><span>Visitar amigos</span></button>
      <button className="invite-btn" onClick={onInvite}><span className="side-icon">🎁</span><span>Convidar</span></button>
    </aside>
  );
}
