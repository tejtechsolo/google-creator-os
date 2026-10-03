import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { decryptSecret } from "@/lib/auth/encryption";
import { verifyTotp } from "@/lib/auth/totp";
import { verifyRecoveryCode } from "@/lib/auth/recovery";
import { grantStepUp } from "@/lib/auth/step-up";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { code?: string; recoveryCode?: string };
  const hasCode = !!body?.code;
  const hasRecoveryCode = !!body?.recoveryCode;
  if (hasCode === hasRecoveryCode) return NextResponse.json({ error: "Provide exactly one authenticator or recovery code." }, { status: 400 });
  if (!allowAuthAttempt("step-up:" + user.id, 5)) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  let valid = false;
  let recoveryId: string | undefined;
  if (body.code) {
    const factor = await db.mfaFactor.findUnique({ where: { userId_type: { userId: user.id, type: "TOTP" } } });
    if (factor?.verifiedAt) { try { valid = verifyTotp(decryptSecret(factor.secretEnc), body.code); } catch { valid = false; } }
  } else if (body.recoveryCode) {
    const codes = await db.recoveryCode.findMany({ where: { userId: user.id, usedAt: null } });
    for (const item of codes) {
      if (await verifyRecoveryCode(body.recoveryCode, item.codeHash)) { recoveryId = item.id; valid = true; break; }
    }
  }
  if (!valid) return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });

  if (recoveryId) {
    const consumed = await db.recoveryCode.updateMany({ where: { id: recoveryId, userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    if (consumed.count !== 1) return NextResponse.json({ error: "Invalid or already-used recovery code." }, { status: 401 });
  }
  await grantStepUp(user.id);
  return NextResponse.json({ ok: true, expiresInSeconds: 600 });
}