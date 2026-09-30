import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from "@/lib/auth/totp";

describe("TOTP", () => {
  it("verifies a valid current code and rejects an invalid code", () => {
    const secret = generateTotpSecret();
    const timestamp = 1_700_000_000_000;
    const counter = Math.floor(timestamp / 1000 / 30);
    const key = Buffer.from(secret, "base64");
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac("sha1", key).update(buf).digest();
    const offset = digest[digest.length - 1] & 0xf;
    const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    const code = String(value).padStart(6, "0");
    expect(verifyTotp(secret, code, timestamp)).toBe(true);
    expect(verifyTotp(secret, "000000", timestamp)).toBe(false);
  });

  it("rejects malformed codes and builds an OTP auth URI", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "12", 1_700_000_000_000)).toBe(false);
    expect(buildOtpAuthUri(secret, "test@example.com")).toContain("otpauth://totp/");
  });
});
