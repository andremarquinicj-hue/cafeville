"use client";
import AuthGuard from '@/components/AuthGuard';
import GameView from '@/components/GameView';
export default function GamePage(){return <AuthGuard><GameView/></AuthGuard>;}
