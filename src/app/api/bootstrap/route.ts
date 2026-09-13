import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizeUsername, START_COINS } from "@/lib/game-server";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const displayName = String(body?.displayName ?? "").trim();
    const username = normalizeUsername(String(body?.username ?? ""));

    if (displayName.length < 2 || displayName.length > 30) {
      return NextResponse.json({ error: "O nome precisa ter entre 2 e 30 caracteres." }, { status: 400 });
    }
    if (username.length < 3 || username.length > 18) {
      return NextResponse.json({ error: "O usuário precisa ter entre 3 e 18 caracteres." }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.doc(`users/${auth.uid}`);
    const publicRef = db.doc(`publicProfiles/${auth.uid}`);
    const usernameRef = db.doc(`usernames/${username}`);
    const cafeRef = db.doc(`cafes/${auth.uid}`);

    await db.runTransaction(async (tx) => {
      const [existingUser, existingUsername] = await Promise.all([
        tx.get(userRef),
        tx.get(usernameRef),
      ]);

      if (existingUser.exists) return;
      if (existingUsername.exists) throw new Error("USERNAME_EXISTS");

      const now = FieldValue.serverTimestamp();
      const firstName = displayName.split(" ")[0];
      tx.set(userRef, {
        uid: auth.uid,
        email: auth.email ?? null,
        displayName,
        username,
        role: "player",
        level: 1,
        xp: 0,
        coins: START_COINS,
        popularity: 50,
        createdAt: now,
        lastSeenAt: now,
      });
      tx.set(publicRef, {
        uid: auth.uid,
        displayName,
        displayNameLower: displayName.toLowerCase(),
        username,
        usernameLower: username,
        level: 1,
        xp: 0,
        coins: START_COINS,
        popularity: 50,
        cafeName: `Café de ${firstName}`,
        avatar: "☕",
        createdAt: now,
      });
      tx.set(usernameRef, { uid: auth.uid, createdAt: now });
      tx.set(cafeRef, {
        ownerId: auth.uid,
        name: `Café de ${firstName}`,
        theme: "classic",
        totalVisits: 0,
        likes: 0,
        layoutVersion: 1,
        createdAt: now,
      });
    });

    return NextResponse.json({ ok: true, startCoins: START_COINS });
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }
    if (error?.message === "USERNAME_EXISTS") {
      return NextResponse.json({ error: "Esse nome de usuário já está em uso." }, { status: 409 });
    }
    console.error("bootstrap", error);
    return NextResponse.json({ error: "Não foi possível criar o perfil do jogador." }, { status: 500 });
  }
}
