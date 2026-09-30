import crypto from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createRecoveryCode() {
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
  return raw.match(/.{1,5}/g)?.join("-") ?? raw;
}

export function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
