import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

const COOKIE = "gcos_session";
const DAYS = 30;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 86400000);
  await db.session.create({ data: { userId, tokenHash: hash(token), expiresAt } });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  }
  store.delete(COOKIE);
}
