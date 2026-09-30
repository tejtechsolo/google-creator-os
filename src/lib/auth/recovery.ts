import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(8).toString("hex").toUpperCase();
    return raw.match(/.{1,4}/g)?.join("-") ?? raw;
  });
}

export async function hashRecoveryCode(code: string) {
  const salt = crypto.randomBytes(16);
  const derived = (await scrypt(code.replace(/-/g, "").toUpperCase(), salt, 32, { N: 16384, r: 8, p: 1 })) as Buffer;
  return `scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyRecoveryCode(code: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const values = Object.fromEntries(parts[1].split(",").map((v) => v.split("=")));
  const expected = Buffer.from(parts[3], "base64url");
  const actual = (await scrypt(code.replace(/-/g, "").toUpperCase(), Buffer.from(parts[2], "base64url"), expected.length, { N: Number(values.N), r: Number(values.r), p: Number(values.p) })) as Buffer;
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
