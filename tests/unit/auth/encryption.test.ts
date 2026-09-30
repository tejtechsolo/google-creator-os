import { beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/auth/encryption";

describe("auth secret encryption", () => {
  beforeEach(() => {
    process.env.AUTH_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64url");
  });
  it("round-trips encrypted secrets", () => {
    const encrypted = encryptSecret("totp-secret-value");
    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain("totp-secret-value");
    expect(decryptSecret(encrypted)).toBe("totp-secret-value");
  });
  it("rejects tampered ciphertext", () => {
    const encrypted = encryptSecret("secret");
    const parts = encrypted.split(".");
    parts[3] = parts[3] + "x";
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});
