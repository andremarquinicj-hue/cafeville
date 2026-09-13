"use client";

import { apiPost } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type Props = { open: boolean; onClose: () => void };

export default function InviteModal({ open, onClose }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || code) return;
    apiPost<{ inviteCode: string }>("/api/invite/code", {})
      .then(data => setCode(data.inviteCode))
      .catch(e => setMessage(e.message));
  }, [open, code]);

  const link = useMemo(() => {
    if (!code || typeof window === "undefined") return "";
    return `${window.location.origin}/cadastro?convite=${encodeURIComponent(code)}`;
  }, [code]);

  if (!open) return null;

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setMessage("✅ Link copiado! Agora é só enviar para seus amigos.");
  }

  async function shareLink() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Jogue CaféVille comigo!",
          text: "Crie seu café e venha jogar CaféVille comigo ☕",
          url: link,
        });
        return;
      } catch {}
    }
    await copyLink();
  }

  return (
    <div className="cv-modal-backdrop" onMouseDown={onClose}>
      <section className="cv-modal invite-modal" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="invite-art">🎁</div>
        <h2>Convide amigos para o CaféVille</h2>
        <p>Quando alguém criar uma conta pelo seu link, <strong>você recebe 500 moedas</strong> e a pessoa nova começa com <strong>250 moedas extras</strong>.</p>
        <div className="invite-code-box">
          <small>Seu código</small>
          <strong>{code || "Gerando..."}</strong>
        </div>
        <label className="invite-link-field">
          Link de convite
          <input value={link || "Preparando seu link..."} readOnly />
        </label>
        <div className="invite-actions">
          <button className="primary-btn" onClick={shareLink} disabled={!link}>📤 Compartilhar convite</button>
          <button className="secondary-btn" onClick={copyLink} disabled={!link}>📋 Copiar link</button>
        </div>
        <div className="invite-foot-note">Depois do cadastro, vocês recebem uma sugestão para seguir o café um do outro — cada um decide se quer seguir.</div>
        {message && <div className="cv-toast-inline">{message}</div>}
      </section>
    </div>
  );
}
