import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const KEYLEN = 64;
const N = 16384;
const R = 8;
const P = 1;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = (await scrypt(password, salt, KEYLEN, { N, r: R, p: P })) as Buffer;
  return `scrypt$N=${N},r=${R},p=${P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, params, saltB64, hashB64] = encoded.split("$");
  if (algorithm !== "scrypt" || !params || !saltB64 || !hashB64) return false;
  const values = Object.fromEntries(params.split(",").map((v) => v.split("=")));
  const n = Number(values.N), r = Number(values.r), p = Number(values.p);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const actual = (await scrypt(password, salt, expected.length, { N: n, r, p })) as Buffer;
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
