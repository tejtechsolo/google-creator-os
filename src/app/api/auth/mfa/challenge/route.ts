import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { verifyTotp } from "@/lib/auth/totp";
import { verifyRecoveryCode } from "@/lib/auth/recovery";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: string; code?: string; recoveryCode?: string };
  if (!body?.token || (!body.code && !body.recoveryCode)) return NextResponse.json({ error: "Invalid MFA challenge." }, { status: 400 });
  const challenge = await db.mfaChallenge.findUnique({ where: { tokenHash: hashOpaqueToken(body.token) } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date()) return NextResponse.json({ error: "Invalid or expired MFA challenge." }, { status: 400 });
  if (!allowAuthAttempt("mfa:" + challenge.userId, 5)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const factor = await db.mfaFactor.findUnique({ where: { userId_type: { userId: challenge.userId, type: "TOTP" } } });
  let valid = !!factor?.verifiedAt && !!body.code && verifyTotp(factor.secretEnc, body.code);
  let recoveryId: string | undefined;
  if (!valid && body.recoveryCode) {
    const codes = await db.recoveryCode.findMany({ where: { userId: challenge.userId, usedAt: null } });
    for (const item of codes) if (await verifyRecoveryCode(body.recoveryCode, item.codeHash)) { valid = true; recoveryId = item.id; break; }
  }
  if (!valid) return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });

  await db.$transaction(async (tx) => {
    await tx.mfaChallenge.update({ where: { id: challenge.id }, data: { usedAt: new Date() } });
    if (recoveryId) await tx.recoveryCode.updateMany({ where: { id: recoveryId, usedAt: null }, data: { usedAt: new Date() } });
  });
  await createSession(challenge.userId);
  return NextResponse.json({ ok: true, authenticated: true, redirectTo: "/dashboard" });
}
