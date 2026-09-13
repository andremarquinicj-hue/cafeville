import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const targetUid = String(body?.targetUid ?? "").trim();
    if (!targetUid || targetUid === auth.uid) return NextResponse.json({ ok: true });

    const db = getAdminDb();
    const visitRef = db.doc(`cafes/${targetUid}/visitors/${auth.uid}`);
    const cafeRef = db.doc(`cafes/${targetUid}`);

    await db.runTransaction(async (tx) => {
      const [old, cafe] = await Promise.all([tx.get(visitRef), tx.get(cafeRef)]);
      if (!cafe.exists) throw new Error("CAFE_NOT_FOUND");
      const last = old.data()?.lastVisitAt?.toMillis?.() ?? 0;
      const now = Date.now();
      tx.set(visitRef, {
        visitorId: auth.uid,
        lastVisitAt: Timestamp.now(),
        count: FieldValue.increment(1),
      }, { merge: true });
      if (now - last > 6 * 60 * 60 * 1000) {
        tx.update(cafeRef, { totalVisits: FieldValue.increment(1) });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    if (error?.message === "CAFE_NOT_FOUND") return NextResponse.json({ error: "Café não encontrado." }, { status: 404 });
    console.error("visit", error);
    return NextResponse.json({ error: "Não foi possível registrar a visita." }, { status: 500 });
  }
}
