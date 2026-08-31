import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { googleAuthorizationUrl } from "@/lib/google/oauth";
import { scopesFor } from "@/lib/google/scopes";

export async function GET(request: NextRequest) {
  const services = (request.nextUrl.searchParams.get("services") ?? "gmail,drive,youtube,calendar,sheets").split(",");
  const state = crypto.randomBytes(24).toString("hex");
  const url = googleAuthorizationUrl(state, scopesFor(services));
  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  response.cookies.set("google_oauth_services", services.join(","), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
