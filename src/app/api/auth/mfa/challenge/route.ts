import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { decryptSecret } from "@/lib/auth/encryption";
import { verifyTotp } from "@/lib/auth/totp";
import { verifyRecoveryCode } from "@/lib/auth/recovery";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token?: string;
    code?: string;
    recoveryCode?: string;
  };

  const hasCode = !!body?.code;
  const hasRecoveryCode = !!body?.recoveryCode;
  if (!body?.token || hasCode === hasRecoveryCode) {
    return NextResponse.json({ error: "Invalid MFA challenge." }, { status: 400 });
  }

  const challenge = await db.mfaChallenge.findUnique({
    where: { tokenHash: hashOpaqueToken(body.token) },
  });

  if (
    !challenge ||
    challenge.purpose !== "LOGIN" ||
    challenge.usedAt ||
    challenge.expiresAt <= new Date()
  ) {
    return NextResponse.json({ error: "Invalid or expired MFA challenge." }, { status: 400 });
  }

  if (!allowAuthAttempt("mfa:" + challenge.userId, 5)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let recoveryId: string | undefined;
  let valid = false;

  if (body.code) {
    const factor = await db.mfaFactor.findUnique({
      where: { userId_type: { userId: challenge.userId, type: "TOTP" } },
    });

    if (factor?.verifiedAt) {
      try {
        valid = verifyTotp(decryptSecret(factor.secretEnc), body.code);
      } catch {
        valid = false;
      }
    }
  } else if (body.recoveryCode) {
    const codes = await db.recoveryCode.findMany({
      where: { userId: challenge.userId, usedAt: null },
    });

    for (const item of codes) {
      if (await verifyRecoveryCode(body.recoveryCode, item.codeHash)) {
        recoveryId = item.id;
        valid = true;
        break;
      }
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid MFA code." }, { status: 401 });
  }

  const consumed = await db.$transaction(async (tx) => {
    const result = await tx.mfaChallenge.updateMany({
      where: {
        id: challenge.id,
        purpose: "LOGIN",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (result.count !== 1) return false;

    if (recoveryId) {
      const recoveryResult = await tx.recoveryCode.updateMany({
        where: { id: recoveryId, userId: challenge.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (recoveryResult.count !== 1) return false;
    }

    return true;
  });

  if (!consumed) {
    return NextResponse.json({ error: "Invalid or expired MFA challenge." }, { status: 400 });
  }

  await createSession(challenge.userId);
  return NextResponse.json({ ok: true, authenticated: true, redirectTo: "/dashboard" });
}
