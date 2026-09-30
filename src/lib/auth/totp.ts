import crypto from "node:crypto";

function secretToBuffer(secret: string) {
  return Buffer.from(secret.replace(/\s+/g, ""), "base64");
}

function hotp(secret: string, counter: number) {
  const key = secretToBuffer(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, "0");
}

export function generateTotpSecret() {
  return crypto.randomBytes(20).toString("base64");
}

export function verifyTotp(secret: string, code: string, timestamp = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(timestamp / 1000 / 30);
  for (const delta of [-1, 0, 1]) {
    if (hotp(secret, counter + delta) === code) return true;
  }
  return false;
}

export function buildOtpAuthUri(secret: string, email: string, issuer = "Google Creator OS") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
