import { NextRequest } from 'next/server';
import { gameRequest } from '@/services/server-game';
export const runtime='nodejs';
export const POST=(req:NextRequest)=>gameRequest(req,'cook');
