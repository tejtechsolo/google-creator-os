import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { credentialsSchema } from "@/lib/auth/validation";
import { consumeAuthAttempt } from "@/lib/auth/abuse";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const rate = consumeAuthAttempt(request.headers.get("x-forwarded-for") ?? "unknown");
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, include: { passwordCredential: true, mfaFactors: true } });
  const valid = user?.passwordCredential ? await verifyPassword(parsed.data.password, user.passwordCredential.passwordHash) : false;
  if (!user || !valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  if (!user.emailVerifiedAt) return NextResponse.json({ error: "Please verify your email before signing in." }, { status: 403 });

  const mfaEnabled = user.mfaFactors.some((factor) => factor.type === "TOTP" && factor.verifiedAt);
  if (mfaEnabled) {
    const challengeToken = createOpaqueToken();
    await db.mfaChallenge.create({
      data: { userId: user.id, tokenHash: hashOpaqueToken(challengeToken), expiresAt: new Date(Date.now() + 5 * 60_000) },
    });
    return NextResponse.json({ ok: true, mfaRequired: true, challengeToken });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}