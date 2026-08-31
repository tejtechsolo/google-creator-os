import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createGoogleOAuthClient } from "@/lib/google/oauth";
import { encryptToken } from "@/lib/google/token-crypto";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("google_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth callback" }, { status: 400 });
  }

  const oauth = createGoogleOAuthClient();
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const me = await oauth2.userinfo.get();

  // TODO: replace with the signed-in application session user.
  // Never map a production user from a query parameter.
  const userEmail = request.nextUrl.searchParams.get("user");
  if (!userEmail) {
    return NextResponse.json({ error: "Application session mapping is not configured", googleAccount: me.data.email }, { status: 501 });
  }

  const user = await db.user.upsert({
    where: { email: userEmail },
    create: { email: userEmail, name: me.data.name ?? undefined, image: me.data.picture ?? undefined },
    update: { name: me.data.name ?? undefined, image: me.data.picture ?? undefined },
  });

  if (tokens.refresh_token) {
    await db.integration.upsert({
      where: { userId_provider_service: { userId: user.id, provider: "GOOGLE", service: "GMAIL" } },
      create: {
        userId: user.id, provider: "GOOGLE", service: "GMAIL",
        googleAccountId: me.data.id ?? undefined, googleEmail: me.data.email ?? undefined,
        scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        accessTokenEnc: tokens.access_token ? encryptToken(tokens.access_token) : undefined,
        accessTokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      update: {
        googleAccountId: me.data.id ?? undefined, googleEmail: me.data.email ?? undefined,
        scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        accessTokenEnc: tokens.access_token ? encryptToken(tokens.access_token) : undefined,
        accessTokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        status: "CONNECTED",
      },
    });
  }

  return NextResponse.redirect(new URL("/settings/integrations?connected=google", request.url));
}
