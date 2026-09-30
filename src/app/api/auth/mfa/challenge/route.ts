import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { verifyTotp } from "@/lib/auth/totp";
import { verifyRecoveryCode } from "@/lib/auth/recovery";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { userId?: string; token?: string; code?: string; recoveryCode?: string };
  if (!body?.userId || !body.token || (!body.code && !body.recoveryCode)) return NextResponse.json({ error: "Invalid MFA challenge." }, { status: 400 });
  const challenge = await db.mfaChallenge.findUnique({ where: { tokenHash: hashOpaqueToken(body.token) } });
  if (!challenge || challenge.userId !== body.userId || challenge.usedAt || challenge.expiresAt <= new Date()) return NextResponse.json({ error: "Invalid or expired MFA challenge." }, { status: 400 });
  if (!allowAuthAttempt(`mfa:${challenge.userId}`, 5)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const factor = await db.mfaFactor.findUnique({ where: { userId_type: { userId: challenge.userId, type: "TOTP" } } });
  let valid = !!factor?.verifiedAt && !!body.code && verifyTotp(factor.secretEnc, body.code);
  let recoveryId: string | undefined;
  if (!valid && body.recoveryCode) {
    const codes = await db.recoveryCode.findMany({ where: { userId: challenge.userId, usedAt: null } });
    for (const item of codes) if (await verifyRecoveryCode(body.recoveryCode, item.codeHash)) { valid = true; recoveryId = item.id; break; }
  }
  if (!valid) return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });
  await db.$transaction([
    db.mfaChallenge.update({ where: { id: challenge.id }, data: { usedAt: new Date() } }),
    ...(recoveryId ? [db.recoveryCode.update({ where: { id: recoveryId }, data: { usedAt: new Date() } })] : []),
  ]);
  return NextResponse.json({ ok: true, authenticated: true, redirectTo: "/dashboard" });
}
