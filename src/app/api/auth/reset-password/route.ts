import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { destroyAllSessions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  const policyError = validatePasswordPolicy(parsed.data.password);
  if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashOpaqueToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.passwordCredential.upsert({
      where: { userId: record.userId },
      create: { userId: record.userId, passwordHash },
      update: { passwordHash, passwordChangedAt: new Date() },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  return NextResponse.json({ ok: true, message: "Password reset successfully." });
}
