import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const jobId = String(body?.jobId ?? "").trim();
    if (!jobId) return NextResponse.json({ error: "Preparo inválido." }, { status: 400 });

    const db = getAdminDb();
    const jobRef = db.doc(`cookJobs/${jobId}`);
    const userRef = db.doc(`users/${auth.uid}`);
    const publicRef = db.doc(`publicProfiles/${auth.uid}`);

    const result = await db.runTransaction(async (tx) => {
      const [jobSnap, userSnap] = await Promise.all([tx.get(jobRef), tx.get(userRef)]);
      if (!jobSnap.exists || !userSnap.exists) throw new Error("NOT_FOUND");
      const job = jobSnap.data()!;
      const user = userSnap.data()!;

      if (job.ownerId !== auth.uid) throw new Error("FORBIDDEN");
      if (job.status !== "cooking") throw new Error("ALREADY_COLLECTED");
      if (job.readyAt.toMillis() > Date.now()) throw new Error("NOT_READY");

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
      tx.update(userRef, { level, xp, coins: nextCoins, lastSeenAt: FieldValue.serverTimestamp() });
      tx.update(publicRef, { level, xp, coins: nextCoins });

      return { level, xp, coinsGain, levelReward, nextCoins };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    const map: Record<string, [string, number]> = {
      UNAUTHENTICATED: ["Faça login para continuar.", 401],
      NOT_FOUND: ["Preparo não encontrado.", 404],
      FORBIDDEN: ["Esse preparo não é seu.", 403],
      ALREADY_COLLECTED: ["Esse prato já foi servido.", 409],
      NOT_READY: ["O prato ainda não ficou pronto.", 400],
    };
    const known = map[error?.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error("collect-recipe", error);
    return NextResponse.json({ error: "Não foi possível servir o prato." }, { status: 500 });
  }
}
