import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

async function getProfiles(uids: string[]) {
  const db = getAdminDb();
  const unique = [...new Set(uids)].slice(0, 50);
  const snaps = await Promise.all(unique.map(uid => db.doc(`publicProfiles/${uid}`).get()));
  return snaps.filter(s => s.exists && !s.data()?.disabled).map(s => s.data());
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const mode = String(body?.mode ?? "suggestions");
    const db = getAdminDb();

    if (mode === "suggestions") {
      const snap = await db.collection(`followSuggestions/${auth.uid}/items`).limit(20).get();
      const targets = snap.docs.map(d => String(d.data()?.targetUid ?? "")).filter(Boolean);
      const profiles = await getProfiles(targets);
      const reasonMap = new Map(snap.docs.map(d => [String(d.data()?.targetUid ?? ""), String(d.data()?.reason ?? "") ]));
      return NextResponse.json({ players: profiles.map((p:any) => ({ ...p, reason: reasonMap.get(p.uid) || "" })) });
    }

    if (mode === "following") {
      const snap = await db.collection("follows").where("followerUid", "==", auth.uid).limit(50).get();
      const profiles = await getProfiles(snap.docs.map(d => String(d.data()?.targetUid ?? "")));
      return NextResponse.json({ players: profiles });
    }

    if (mode === "followers") {
      const snap = await db.collection("follows").where("targetUid", "==", auth.uid).limit(50).get();
      const profiles = await getProfiles(snap.docs.map(d => String(d.data()?.followerUid ?? "")));
      return NextResponse.json({ players: profiles });
    }

    return NextResponse.json({ error: "Lista inválida." }, { status: 400 });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("social-list", error);
    return NextResponse.json({ error: "Não foi possível carregar a comunidade." }, { status: 500 });
  }
}
