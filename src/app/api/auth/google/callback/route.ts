import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createGoogleOAuthClient } from "@/lib/google/oauth";
import { encryptToken } from "@/lib/google/token-crypto";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("google_oauth_state")?.value;
  const services = (request.cookies.get("google_oauth_services")?.value ?? "gmail")
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth callback" }, { status: 400 });
  }

  const oauth = createGoogleOAuthClient();
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const me = await oauth2.userinfo.get();
  const email = me.data.email;

  if (!email) return NextResponse.json({ error: "Google account email unavailable" }, { status: 400 });

  const user = await db.user.upsert({
    where: { email },
    create: { email, name: me.data.name ?? undefined, image: me.data.picture ?? undefined },
    update: { name: me.data.name ?? undefined, image: me.data.picture ?? undefined },
  });

  const scopeList = (tokens.scope ?? "").split(" ").filter(Boolean);
  const servicesToStore = services.length ? services : ["gmail"];

  for (const service of servicesToStore) {
    const normalized = service.toUpperCase().replace("-", "_");
    const allowed = ["GMAIL", "DRIVE", "PHOTOS", "YOUTUBE", "ADS", "CALENDAR", "SHEETS", "ANALYTICS", "SEARCH_CONSOLE", "BUSINESS_PROFILE", "CONTACTS", "TASKS", "DOCS", "FORMS"];
    if (!allowed.includes(normalized)) continue;

    await db.integration.upsert({
      where: { userId_provider_service: { userId: user.id, provider: "GOOGLE", service: normalized as never } },
      create: {
        userId: user.id,
        provider: "GOOGLE",
        service: normalized as never,
        googleAccountId: me.data.id ?? undefined,
        googleEmail: email,
        scopes: scopeList,
        refreshTokenEnc: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
        accessTokenEnc: tokens.access_token ? encryptToken(tokens.access_token) : undefined,
        accessTokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      update: {
        googleAccountId: me.data.id ?? undefined,
        googleEmail: email,
        scopes: scopeList,
        ...(tokens.refresh_token ? { refreshTokenEnc: encryptToken(tokens.refresh_token) } : {}),
        ...(tokens.access_token ? { accessTokenEnc: encryptToken(tokens.access_token) } : {}),
        accessTokenExpires: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        status: "CONNECTED",
        lastError: null,
      },
    });
  }

  await createSession(user.id);
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("google_oauth_services");
  return response;
}
