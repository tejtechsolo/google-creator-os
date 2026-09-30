import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { credentialsSchema } from "@/lib/auth/validation";
import { consumeAuthAttempt } from "@/lib/auth/abuse";
import { sendPasswordResetEmail } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.pick({ email: true }).safeParse(body);
  const rate = consumeAuthAttempt(request.headers.get("x-forwarded-for") ?? "unknown", 5);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const rawToken = createOpaqueToken();
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashOpaqueToken(rawToken), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    await sendPasswordResetEmail(user.email, rawToken);
  }
  return NextResponse.json({ ok: true, message: "If the account exists, a reset link will be sent." });
}
