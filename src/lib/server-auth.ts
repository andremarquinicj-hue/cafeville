import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function requireUser(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED");
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new Error("UNAUTHENTICATED");
  }
}
