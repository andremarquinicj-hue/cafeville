import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { POST as manage } from '@/app/api/admin/manage/route';
export const runtime='nodejs';
// Compatibility for the v0.3 admin UI, with the same transaction and audit rules.
export async function POST(req:NextRequest){const a=await req.json();return manage(new NextRequest(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({...a,itemId:a.itemId||a.giftId,requestId:a.requestId||randomUUID()})}));}
