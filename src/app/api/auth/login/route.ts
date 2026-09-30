import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { credentialsSchema } from "@/lib/auth/validation";
import { consumeAuthAttempt } from "@/lib/auth/abuse";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const rate = consumeAuthAttempt(request.headers.get("x-forwarded-for") ?? "unknown");
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, include: { passwordCredential: true } });
  const valid = user?.passwordCredential ? await verifyPassword(parsed.data.password, user.passwordCredential.passwordHash) : false;
  if (!user || !valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
