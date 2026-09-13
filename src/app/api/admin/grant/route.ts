import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const db = getAdminDb();
    const adminSnap = await db.doc(`users/${auth.uid}`).get();
    if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Acesso exclusivo do administrador." }, { status: 403 });
    }

    const body = await req.json();
    const targetUid = String(body?.targetUid ?? "").trim();
    const type = String(body?.type ?? "coins");
    const amount = Math.max(0, Math.min(1_000_000, Number(body?.amount ?? 0)));
    const giftId = String(body?.giftId ?? "").trim();
    if (!targetUid) return NextResponse.json({ error: "Jogador inválido." }, { status: 400 });

    if (type === "coins") {
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      const userRef = db.doc(`users/${targetUid}`);
      const publicRef = db.doc(`publicProfiles/${targetUid}`);
      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) throw new Error("PLAYER_NOT_FOUND");
        const nextCoins = Number(userSnap.data()?.coins ?? 0) + amount;
        tx.update(userRef, { coins: nextCoins });
        tx.update(publicRef, { coins: nextCoins });
      });
    } else if (type === "gift") {
      if (!giftId) return NextResponse.json({ error: "Informe o presente." }, { status: 400 });
      const userSnap = await db.doc(`users/${targetUid}`).get();
      if (!userSnap.exists) throw new Error("PLAYER_NOT_FOUND");
      const itemRef = db.collection(`inventories/${targetUid}/items`).doc();
      await itemRef.set({ itemId: giftId, quantity: 1, source: "admin", receivedAt: FieldValue.serverTimestamp() });
    } else {
      return NextResponse.json({ error: "Tipo de envio inválido." }, { status: 400 });
    }

    await db.collection("adminLogs").add({
      adminUid: auth.uid,
      targetUid,
      type,
      amount: type === "coins" ? amount : null,
      giftId: type === "gift" ? giftId : null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    if (error?.message === "PLAYER_NOT_FOUND") return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    console.error("admin-grant", error);
    return NextResponse.json({ error: "Não foi possível enviar a recompensa." }, { status: 500 });
  }
}
