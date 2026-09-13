import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const targetUid = String(body?.targetUid ?? "").trim();
    const action = body?.action === "unfollow" ? "unfollow" : "follow";

    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(targetUid) || targetUid === auth.uid) return NextResponse.json({ error: "Jogador inválido." }, { status: 400 });

    const db = getAdminDb();
    const followRef = db.doc(`follows/${auth.uid}_${targetUid}`);
    const myPublicRef = db.doc(`publicProfiles/${auth.uid}`);
    const targetPublicRef = db.doc(`publicProfiles/${targetUid}`);

    let following = false;
    await db.runTransaction(async (tx) => {
      const [followSnap, mySnap, targetSnap] = await Promise.all([
        tx.get(followRef),
        tx.get(myPublicRef),
        tx.get(targetPublicRef),
      ]);
      if (!mySnap.exists || !targetSnap.exists || targetSnap.data()?.disabled) throw new Error("PLAYER_NOT_FOUND");

      const myFollowing = Number(mySnap.data()?.followingCount ?? 0);
      const targetFollowers = Number(targetSnap.data()?.followersCount ?? 0);

      if (action === "follow") {
        following = true;
        if (!followSnap.exists) {
          tx.set(followRef, {
            followerUid: auth.uid,
            targetUid,
            createdAt: FieldValue.serverTimestamp(),
          });
          tx.update(myPublicRef, { followingCount: myFollowing + 1 });
          tx.set(db.doc(`users/${auth.uid}`), { followingCount: myFollowing + 1 }, { merge: true });
          tx.update(targetPublicRef, { followersCount: targetFollowers + 1 });
          tx.set(db.doc(`users/${targetUid}`), { followersCount: targetFollowers + 1 }, { merge: true });
        }
      } else {
        following = false;
        if (followSnap.exists) {
          tx.delete(followRef);
          tx.update(myPublicRef, { followingCount: Math.max(0, myFollowing - 1) });
          tx.set(db.doc(`users/${auth.uid}`), { followingCount: Math.max(0, myFollowing - 1) }, { merge: true });
          tx.update(targetPublicRef, { followersCount: Math.max(0, targetFollowers - 1) });
          tx.set(db.doc(`users/${targetUid}`), { followersCount: Math.max(0, targetFollowers - 1) }, { merge: true });
        }
      }

      tx.delete(db.doc(`followSuggestions/${auth.uid}/items/${targetUid}`));
    });

    return NextResponse.json({ ok: true, following });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    if (error?.message === "PLAYER_NOT_FOUND") return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    console.error("social-follow", error);
    return NextResponse.json({ error: "Não foi possível atualizar esta amizade." }, { status: 500 });
  }
}
