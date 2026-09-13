"use client";

import { useEffect, useState } from "react";

type Props = { activeJobCount?: number; onOpenRecipes?: () => void };

export default function CafeGame({ activeJobCount = 0, onOpenRecipes }: Props) {
  const [tip, setTip] = useState("Clique no fogão para preparar uma receita!");

  useEffect(() => {
    const tips = [
      "Clique no fogão para preparar uma receita!",
      "Decore seu café para deixar os clientes mais felizes.",
      "Visite seus amigos e acompanhe o ranking da comunidade.",
      "Receitas mais longas rendem mais moedas e experiência.",
    ];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % tips.length; setTip(tips[i]); }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="cafe-scene-wrap">
      <img className="cafe-scene-image" src="/assets/cafeville-scene.png" alt="Interior do CaféVille" />
      <button className="scene-hotspot stove" onClick={onOpenRecipes} title="Abrir receitas">
        <span>🔥</span><small>{activeJobCount > 0 ? `${activeJobCount} preparando` : "Cozinhar"}</small>
      </button>
      <div className="scene-bubble bubble-one">❤️</div>
      <div className="scene-bubble bubble-two">☕</div>
      <div className="scene-bubble bubble-three">🍔</div>
      <div className="moving-spark spark-a">✨</div>
      <div className="moving-spark spark-b">✨</div>
      <div className="scene-tip">💡 {tip}</div>
    </div>
  );
}
