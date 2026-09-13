"use client";
import { apiPost } from '@/lib/api';
import { useEffect,useMemo,useState,useRef } from 'react';
import Icon from './Icon';
export default function InviteModal({open,onClose}:{open:boolean;onClose:()=>void}){
 const [code,setCode]=useState(''),[message,setMessage]=useState(''),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[open,onClose]);
 useEffect(()=>{if(!open||code)return;apiPost('/api/invite/code',{}).then(d=>setCode(d.inviteCode)).catch(e=>setMessage(e.message));},[open,code]);
 const link=useMemo(()=>code&&typeof window!=='undefined'?`${window.location.origin}/cadastro?convite=${encodeURIComponent(code)}`:'',[code]);
 if(!open)return null;
 const copy=async()=>{try{await navigator.clipboard.writeText(link);setMessage('Link copiado! Agora é só enviar para seus amigos.');}catch{setMessage('Selecione e copie o link no campo acima.');}};
 const share=async()=>{if(navigator.share){try{await navigator.share({title:'Jogue CaféVille comigo!',text:'Abra seu café e venha jogar comigo!',url:link});return;}catch(e){if(e instanceof Error&&e.name==='AbortError')return;}}await copy();};
 return <div className="cv-modal-backdrop" onMouseDown={onClose}><section className="cv-modal invite-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onMouseDown={e=>e.stopPropagation()}><button ref={close} className="modal-close" aria-label="Fechar convite" onClick={onClose}>×</button><Icon name="gift" size={75}/><h2 id="invite-title">Chame seus amigos para um café</h2><p>Você recebe <strong>500 moedas</strong> quando uma nova conta é criada com seu convite. Seu amigo começa com <strong>3.250 moedas</strong>.</p><div className="invite-code-box"><small>Seu código</small><strong>{code||'Preparando…'}</strong></div><label className="invite-link-field">Link do convite<input value={link} readOnly onFocus={e=>e.currentTarget.select()}/></label><div className="invite-actions"><button disabled={!link} className="primary-btn" onClick={share}>Compartilhar</button><button disabled={!link} className="secondary-btn" onClick={copy}>Copiar link</button></div><div className="invite-foot-note">Vocês receberão uma sugestão para seguir o café um do outro. Cada pessoa escolhe se quer seguir.</div>{message&&<p className="cv-toast-inline" role="status">{message}</p>}</section></div>;
}
