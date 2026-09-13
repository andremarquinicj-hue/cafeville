import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

function makeCode(username: string) {
  const base = username.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "CAFE";
  return `${base}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const db = getAdminDb();
    const userRef = db.doc(`users/${auth.uid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

    const existing = String(userSnap.data()?.inviteCode ?? "").trim();
    if (existing) return NextResponse.json({ inviteCode: existing });

    const username = String(userSnap.data()?.username ?? "cafe");
    let inviteCode = makeCode(username);
    for (let i = 0; i < 5; i++) {
      const codeSnap = await db.doc(`inviteCodes/${inviteCode}`).get();
      if (!codeSnap.exists) break;
      inviteCode = makeCode(username);
    }

    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(userRef);
      const current = String(fresh.data()?.inviteCode ?? "").trim();
      if (current) {
        inviteCode = current;
        return;
      }
      tx.update(userRef, { inviteCode });
      tx.set(db.doc(`inviteCodes/${inviteCode}`), {
        uid: auth.uid,
        username,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ inviteCode });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("invite-code", error);
    return NextResponse.json({ error: "Não foi possível gerar o convite." }, { status: 500 });
  }
}
