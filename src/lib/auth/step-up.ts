import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

const COOKIE = "gcos_step_up";
const TTL_MS = 10 * 60 * 1000;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Call only after the user has successfully completed an explicit
 * re-authentication/MFA verification for the sensitive operation.
 */
export async function grantStepUp(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.mfaChallenge.create({
    data: {
      userId,
      tokenHash: hash(token),
      purpose: "STEP_UP",
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function hasRecentStepUp(userId: string) {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;

  const challenge = await db.mfaChallenge.findFirst({
    where: {
      userId,
      tokenHash: hash(value),
      purpose: "STEP_UP",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return !!challenge;
}

export async function revokeStepUp(userId: string) {
  const value = (await cookies()).get(COOKIE)?.value;
  if (value) {
    await db.mfaChallenge.updateMany({
      where: { userId, tokenHash: hash(value), purpose: "STEP_UP", usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  const store = await cookies();
  store.delete(COOKIE);
}
