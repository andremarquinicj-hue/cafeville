"use client";
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth,db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { doc,onSnapshot } from 'firebase/firestore';
import { useEffect,useState } from 'react';
import Icon from './Icon';
export default function TopBar(){const {user}=useAuth(),[profile,setProfile]=useState<any>({});useEffect(()=>{if(!user)return;return onSnapshot(doc(db,'users',user.uid),s=>setProfile(s.data()||{}),()=>{});},[user]);return <header className="game-header"><Link className="game-brand" href="/jogo"><Icon name="chef" size={40}/><span>Café<span>Ville</span></span></Link><nav className="header-links"><Link href="/jogo">Meu café</Link><Link href="/comunidade">Vizinhos</Link><Link href="/ranking">Ranking</Link>{profile.role==='admin'&&<Link href="/admin">Admin</Link>}</nav><div className="wallet"><span><Icon name="coin"/>{Math.floor(Number(profile.coins||0)).toLocaleString('pt-BR')}</span><span><Icon name="star"/>Nv. {profile.level||1}</span></div><button className="quiet" onClick={()=>signOut(auth)}>Sair</button></header>;}
