import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10 });
const db = getFirestore();

const START_COINS = 3000;

const RECIPES = {
  espresso: { name: "Café Espresso", cost: 15, revenue: 40, xp: 5, seconds: 15 },
  pao_queijo: { name: "Pão de Queijo", cost: 35, revenue: 90, xp: 12, seconds: 30 },
  brigadeiro: { name: "Brigadeiro", cost: 55, revenue: 160, xp: 20, seconds: 60 },
  pizza_marguerita: { name: "Pizza Marguerita", cost: 100, revenue: 300, xp: 45, seconds: 120 }
} as const;

type RecipeId = keyof typeof RECIPES;

function requireAuth(request: any) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Faça login para continuar.");
  return request.auth.uid as string;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export const bootstrapPlayer = onCall(async (request) => {
  const uid = requireAuth(request);
  const displayName = String(request.data?.displayName ?? "").trim();
  const username = normalizeUsername(String(request.data?.username ?? ""));

  if (displayName.length < 2 || displayName.length > 30) {
    throw new HttpsError("invalid-argument", "O nome precisa ter entre 2 e 30 caracteres.");
  }
  if (username.length < 3 || username.length > 18) {
    throw new HttpsError("invalid-argument", "O usuário precisa ter entre 3 e 18 caracteres.");
  }

  const userRef = db.doc(`users/${uid}`);
  const publicRef = db.doc(`publicProfiles/${uid}`);
  const usernameRef = db.doc(`usernames/${username}`);
  const cafeRef = db.doc(`cafes/${uid}`);

  await db.runTransaction(async (tx) => {
    const [existingUser, existingUsername] = await Promise.all([
      tx.get(userRef),
      tx.get(usernameRef),
    ]);

    if (existingUser.exists) return;
    if (existingUsername.exists) {
      throw new HttpsError("already-exists", "Esse nome de usuário já está em uso.");
    }

    const now = FieldValue.serverTimestamp();
    tx.set(userRef, {
      uid,
      email: request.auth?.token?.email ?? null,
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
      uid,
      displayName,
      displayNameLower: displayName.toLowerCase(),
      username,
      usernameLower: username,
      level: 1,
      xp: 0,
      coins: START_COINS,
      popularity: 50,
      cafeName: `Café de ${displayName.split(" ")[0]}`,
      avatar: "☕",
      createdAt: now,
    });
    tx.set(usernameRef, { uid, createdAt: now });
    tx.set(cafeRef, {
      ownerId: uid,
      name: `Café de ${displayName.split(" ")[0]}`,
      theme: "classic",
      totalVisits: 0,
      likes: 0,
      layoutVersion: 1,
      createdAt: now,
    });
  });

  return { ok: true, startCoins: START_COINS };
});

export const startRecipe = onCall(async (request) => {
  const uid = requireAuth(request);
  const recipeId = String(request.data?.recipeId ?? "") as RecipeId;
  const recipe = RECIPES[recipeId];
  if (!recipe) throw new HttpsError("invalid-argument", "Receita inválida.");

  const userRef = db.doc(`users/${uid}`);
  const jobRef = db.collection("cookJobs").doc();

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "Perfil não encontrado.");
    const user = userSnap.data()!;
    if ((user.coins ?? 0) < recipe.cost) {
      throw new HttpsError("failed-precondition", "Moedas insuficientes.");
    }

    const now = Timestamp.now();
    const readyAt = Timestamp.fromMillis(now.toMillis() + recipe.seconds * 1000);
    tx.update(userRef, { coins: FieldValue.increment(-recipe.cost), lastSeenAt: FieldValue.serverTimestamp() });
    tx.set(jobRef, {
      ownerId: uid,
      recipeId,
      recipeName: recipe.name,
      status: "cooking",
      cost: recipe.cost,
      revenue: recipe.revenue,
      xpReward: recipe.xp,
      startedAt: now,
      readyAt,
      collectedAt: null,
    });
  });

  return { ok: true, jobId: jobRef.id };
});

export const collectRecipe = onCall(async (request) => {
  const uid = requireAuth(request);
  const jobId = String(request.data?.jobId ?? "");
  if (!jobId) throw new HttpsError("invalid-argument", "Preparo inválido.");

  const jobRef = db.doc(`cookJobs/${jobId}`);
  const userRef = db.doc(`users/${uid}`);
  const publicRef = db.doc(`publicProfiles/${uid}`);

  const result = await db.runTransaction(async (tx) => {
    const [jobSnap, userSnap] = await Promise.all([tx.get(jobRef), tx.get(userRef)]);
    if (!jobSnap.exists || !userSnap.exists) throw new HttpsError("not-found", "Preparo não encontrado.");

    const job = jobSnap.data()!;
    const user = userSnap.data()!;
    if (job.ownerId !== uid) throw new HttpsError("permission-denied", "Esse preparo não é seu.");
    if (job.status === "collected") throw new HttpsError("already-exists", "Esse prato já foi servido.");
    if (job.readyAt.toMillis() > Date.now()) throw new HttpsError("failed-precondition", "O prato ainda não ficou pronto.");

    let level = Number(user.level ?? 1);
    let xp = Number(user.xp ?? 0) + Number(job.xpReward ?? 0);
    let levelReward = 0;
    while (xp >= level * 100) {
      xp -= level * 100;
      level += 1;
      levelReward += 500 + level * 100;
    }

    const coinsGain = Number(job.revenue ?? 0) + levelReward;
    const nextCoins = Number(user.coins ?? 0) + coinsGain;

    tx.update(jobRef, { status: "collected", collectedAt: FieldValue.serverTimestamp() });
    tx.update(userRef, {
      level,
      xp,
      coins: nextCoins,
      lastSeenAt: FieldValue.serverTimestamp(),
    });
    tx.update(publicRef, { level, xp, coins: nextCoins });

    return { level, xp, coinsGain, levelReward, nextCoins };
  });

  return { ok: true, ...result };
});

export const recordVisit = onCall(async (request) => {
  const uid = requireAuth(request);
  const targetUid = String(request.data?.targetUid ?? "");
  if (!targetUid || targetUid === uid) return { ok: true };

  const visitRef = db.doc(`cafes/${targetUid}/visitors/${uid}`);
  const cafeRef = db.doc(`cafes/${targetUid}`);

  await db.runTransaction(async (tx) => {
    const old = await tx.get(visitRef);
    const last = old.data()?.lastVisitAt?.toMillis?.() ?? 0;
    const now = Date.now();
    tx.set(visitRef, { visitorId: uid, lastVisitAt: Timestamp.now(), count: FieldValue.increment(1) }, { merge: true });
    if (now - last > 6 * 60 * 60 * 1000) {
      tx.update(cafeRef, { totalVisits: FieldValue.increment(1) });
    }
  });
  return { ok: true };
});

export const adminGrant = onCall(async (request) => {
  const adminUid = requireAuth(request);
  const adminSnap = await db.doc(`users/${adminUid}`).get();
  if (!adminSnap.exists || adminSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Acesso exclusivo do administrador.");
  }

  const targetUid = String(request.data?.targetUid ?? "");
  const type = String(request.data?.type ?? "coins");
  const amount = Math.max(0, Math.min(1_000_000, Number(request.data?.amount ?? 0)));
  const giftId = String(request.data?.giftId ?? "").trim();

  if (!targetUid) throw new HttpsError("invalid-argument", "Jogador inválido.");

  if (type === "coins") {
    if (!Number.isFinite(amount) || amount <= 0) throw new HttpsError("invalid-argument", "Valor inválido.");
    const userRef = db.doc(`users/${targetUid}`);
    const publicRef = db.doc(`publicProfiles/${targetUid}`);
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new HttpsError("not-found", "Jogador não encontrado.");
      const nextCoins = Number(userSnap.data()?.coins ?? 0) + amount;
      tx.update(userRef, { coins: nextCoins });
      tx.update(publicRef, { coins: nextCoins });
    });
  } else if (type === "gift") {
    if (!giftId) throw new HttpsError("invalid-argument", "Informe o presente.");
    const itemRef = db.collection(`inventories/${targetUid}/items`).doc();
    await itemRef.set({ itemId: giftId, quantity: 1, source: "admin", receivedAt: FieldValue.serverTimestamp() });
  } else {
    throw new HttpsError("invalid-argument", "Tipo de envio inválido.");
  }

  await db.collection("adminLogs").add({
    adminUid,
    targetUid,
    type,
    amount: type === "coins" ? amount : null,
    giftId: type === "gift" ? giftId : null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});
