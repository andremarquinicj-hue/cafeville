import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { SERVER_RECIPES, ServerRecipeId } from "@/lib/game-server";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    const body = await req.json();
    const recipeId = String(body?.recipeId ?? "") as ServerRecipeId;
    const recipe = SERVER_RECIPES[recipeId];
    if (!recipe) return NextResponse.json({ error: "Receita inválida." }, { status: 400 });

    const db = getAdminDb();
    const userRef = db.doc(`users/${auth.uid}`);
    const publicRef = db.doc(`publicProfiles/${auth.uid}`);
    const jobRef = db.collection("cookJobs").doc();

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error("PROFILE_NOT_FOUND");
      const coins = Number(userSnap.data()?.coins ?? 0);
      if (coins < recipe.cost) throw new Error("NOT_ENOUGH_COINS");

      const now = Timestamp.now();
      const readyAt = Timestamp.fromMillis(now.toMillis() + recipe.seconds * 1000);
      const nextCoins = coins - recipe.cost;
      tx.update(userRef, { coins: nextCoins, lastSeenAt: FieldValue.serverTimestamp() });
      tx.update(publicRef, { coins: nextCoins });
      tx.set(jobRef, {
        ownerId: auth.uid,
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

    return NextResponse.json({ ok: true, jobId: jobRef.id });
  } catch (error: any) {
    const map: Record<string, [string, number]> = {
      UNAUTHENTICATED: ["Faça login para continuar.", 401],
      PROFILE_NOT_FOUND: ["Perfil não encontrado.", 404],
      NOT_ENOUGH_COINS: ["Moedas insuficientes.", 400],
    };
    const known = map[error?.message];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    console.error("start-recipe", error);
    return NextResponse.json({ error: "Não foi possível iniciar a receita." }, { status: 500 });
  }
}
