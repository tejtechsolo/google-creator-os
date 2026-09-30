import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { generateTotpSecret, buildOtpAuthUri } from "@/lib/auth/totp";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = generateTotpSecret();
  const uri = buildOtpAuthUri(secret, user.email);
  await db.mfaFactor.upsert({
    where: { userId_type: { userId: user.id, type: "TOTP" } },
    create: { userId: user.id, type: "TOTP", secretEnc: secret, label: "Authenticator app" },
    update: { secretEnc: secret, verifiedAt: null, label: "Authenticator app" },
  });
  return NextResponse.json({ otpauthUri: uri, manualSecret: secret });
}
