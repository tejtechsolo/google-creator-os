import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth/tokens";
const COOKIE = "gcos_session";
export async function POST() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashOpaqueToken(token) } });
  const session = token ? await db.session.findUnique({ where: { tokenHash: hashOpaqueToken(token) } }) : null;
  if (session) await db.session.deleteMany({ where: { userId: session.userId } });
  const response = NextResponse.json({ ok: true }); response.cookies.delete(COOKIE); return response;
}
