import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function requireUser(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED");
  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    const profile = await getAdminDb().doc(`users/${decoded.uid}`).get();
    if (profile.data()?.disabled) throw new Error('UNAUTHENTICATED');
    return decoded;
  } catch {
    throw new Error("UNAUTHENTICATED");
  }
}
