import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import { INVITEE_BONUS, INVITER_BONUS, normalizeUsername, START_COINS } from "@/lib/game-server";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

function makeInviteCode(username: string) {
  const base = username.replace(/[^a-z0-9]/g, "").slice(0, 8).toUpperCase() || "CAFE";
  return `${base}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const displayName = String(body?.displayName ?? "").trim();
    const username = normalizeUsername(String(body?.username ?? ""));
    const referralCode = String(body?.inviteCode ?? "").trim().toUpperCase();

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

    let ownInviteCode = makeInviteCode(username);
    for (let i = 0; i < 5; i++) {
      const codeSnap = await db.doc(`inviteCodes/${ownInviteCode}`).get();
      if (!codeSnap.exists) break;
      ownInviteCode = makeInviteCode(username);
    }

    const referralRef = referralCode ? db.doc(`inviteCodes/${referralCode}`) : null;
    const referralSnap = referralRef ? await referralRef.get() : null;
    const inviterUid = referralSnap?.exists ? String(referralSnap.data()?.uid ?? "") : "";
    const validInviterUid = inviterUid && inviterUid !== auth.uid ? inviterUid : "";
    const startingCoins = START_COINS + (validInviterUid ? INVITEE_BONUS : 0);

    await db.runTransaction(async (tx) => {
      const readPromises: Promise<any>[] = [tx.get(userRef), tx.get(usernameRef)];
      const inviterUserRef = validInviterUid ? db.doc(`users/${validInviterUid}`) : null;
      const inviterPublicRef = validInviterUid ? db.doc(`publicProfiles/${validInviterUid}`) : null;
      if (inviterUserRef && inviterPublicRef) {
        readPromises.push(tx.get(inviterUserRef), tx.get(inviterPublicRef));
      }
      const reads = await Promise.all(readPromises);
      const existingUser = reads[0];
      const existingUsername = reads[1];
      const inviterUserSnap = validInviterUid ? reads[2] : null;
      const inviterPublicSnap = validInviterUid ? reads[3] : null;

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
        coins: startingCoins,
        popularity: 50,
        inviteCode: ownInviteCode,
        referredBy: validInviterUid || null,
        referralCount: 0,
        followersCount: 0,
        followingCount: 0,
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
        coins: startingCoins,
        popularity: 50,
        cafeName: `Café de ${firstName}`,
        avatar: "☕",
        referralCount: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: now,
      });

      tx.set(usernameRef, { uid: auth.uid, createdAt: now });
      tx.set(db.doc(`inviteCodes/${ownInviteCode}`), { uid: auth.uid, username, createdAt: now });
      tx.set(cafeRef, {
        ownerId: auth.uid,
        name: `Café de ${firstName}`,
        theme: "classic",
        totalVisits: 0,
        likes: 0,
        layoutVersion: 2,
        createdAt: now,
      });

      if (validInviterUid && inviterUserRef && inviterPublicRef) {
        if (inviterUserSnap?.exists && inviterPublicSnap?.exists) {
          const inviterCoins = Number(inviterUserSnap.data()?.coins ?? 0) + INVITER_BONUS;
          const referralCount = Number(inviterUserSnap.data()?.referralCount ?? 0) + 1;
          tx.update(inviterUserRef, { coins: inviterCoins, referralCount });
          tx.update(inviterPublicRef, { coins: inviterCoins, referralCount });

          tx.set(db.doc(`followSuggestions/${auth.uid}/items/${validInviterUid}`), {
            targetUid: validInviterUid,
            reason: "Você entrou pelo convite deste jogador.",
            createdAt: now,
          });
          tx.set(db.doc(`followSuggestions/${validInviterUid}/items/${auth.uid}`), {
            targetUid: auth.uid,
            reason: `${displayName} entrou no CaféVille pelo seu convite.`,
            createdAt: now,
          });
          tx.set(db.collection("inviteEvents").doc(), {
            inviterUid: validInviterUid,
            invitedUid: auth.uid,
            inviteCode: referralCode,
            inviterBonus: INVITER_BONUS,
            inviteeBonus: INVITEE_BONUS,
            createdAt: now,
          });
        }
      }
    });

    return NextResponse.json({
      ok: true,
      startCoins: startingCoins,
      inviteBonus: validInviterUid ? INVITEE_BONUS : 0,
      inviterBonus: validInviterUid ? INVITER_BONUS : 0,
    });
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
