import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

const COOKIE = "gcos_step_up";
const TTL_MS = 10 * 60 * 1000;

export async function grantStepUp(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: TTL_MS / 1000 });
  return { userId, hash, expiresAt: new Date(Date.now() + TTL_MS) };
}

export async function hasRecentStepUp(userId: string) {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const hash = crypto.createHash("sha256").update(value).digest("hex");
  const challenge = await db.mfaChallenge.findFirst({ where: { userId, tokenHash: hash, usedAt: null, expiresAt: { gt: new Date() } } });
  return !!challenge;
}
