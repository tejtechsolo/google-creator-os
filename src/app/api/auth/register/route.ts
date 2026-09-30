import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { hashPassword, validatePasswordPolicy } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/validation";
import { consumeAuthAttempt } from "@/lib/auth/abuse";
import { sendVerificationEmail } from "@/lib/auth/email";

function workspaceSlug(email: string) {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "workspace";
  return `${base}-${createOpaqueToken().slice(0, 8).toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  const policyError = validatePasswordPolicy(parsed.data.password);
  if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });
  const rate = consumeAuthAttempt(request.headers.get("x-forwarded-for") ?? "unknown");
  if (!rate.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });

  const email = parsed.data.email;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Unable to create account with these details." }, { status: 409 });

  const { user, rawToken } = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: parsed.data.name || undefined,
        passwordCredential: { create: { passwordHash: await hashPassword(parsed.data.password) } },
      },
      select: { id: true, email: true },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: parsed.data.name?.trim() ? `${parsed.data.name.trim()}'s Workspace` : "My Workspace",
        slug: workspaceSlug(email),
        ownerId: user.id,
      },
    });

    await tx.workspaceMembership.create({
      data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
    });

    const rawToken = createOpaqueToken();
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { user, rawToken };
  });

  await sendVerificationEmail(user.email, rawToken);
  return NextResponse.json({ message: "Account created. Check your email to verify your account." }, { status: 201 });
}
