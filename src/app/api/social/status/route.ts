import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const targetUid = String(body?.targetUid ?? "").trim();
    if (!targetUid) return NextResponse.json({ error: "Jogador inválido." }, { status: 400 });
    const snap = await getAdminDb().doc(`follows/${auth.uid}_${targetUid}`).get();
    return NextResponse.json({ following: snap.exists });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    return NextResponse.json({ error: "Não foi possível consultar a amizade." }, { status: 500 });
  }
}
