import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";
import { verifyEmailSchema } from "@/lib/auth/validation";

export async function POST(request: NextRequest) {
  const parsed = verifyEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification token." }, { status: 400 });
  const record = await db.emailVerificationToken.findUnique({ where: { tokenHash: hashOpaqueToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return NextResponse.json({ error: "Invalid or expired verification token." }, { status: 400 });
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.emailVerificationToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
  ]);
  return NextResponse.json({ ok: true, message: "Email verified successfully." });
}
