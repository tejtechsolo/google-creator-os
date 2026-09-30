import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { verifyTotp } from "@/lib/auth/totp";
import { decryptSecret } from "@/lib/auth/encryption";
import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/auth/recovery";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: string };
  const factor = await db.mfaFactor.findUnique({ where: { userId_type: { userId: user.id, type: "TOTP" } } });
  if (!factor) return NextResponse.json({ error: "MFA enrollment not found." }, { status: 400 });
  let valid = false;
  try {
    valid = verifyTotp(decryptSecret(factor.secretEnc), body?.code ?? "");
  } catch {
    valid = false;
  }
  if (!valid) return NextResponse.json({ error: "Invalid authenticator code." }, { status: 400 });
  const codes = generateRecoveryCodes();
  await db.$transaction([
    db.mfaFactor.update({ where: { id: factor.id }, data: { verifiedAt: new Date() } }),
    db.recoveryCode.deleteMany({ where: { userId: user.id } }),
    ...await Promise.all(codes.map(async code => db.recoveryCode.create({ data: { userId: user.id, codeHash: await hashRecoveryCode(code) } }))),
  ]);
  return NextResponse.json({ ok: true, recoveryCodes: codes });
}
