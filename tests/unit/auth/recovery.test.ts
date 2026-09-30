import { describe, expect, it } from "vitest";
import { generateRecoveryCodes, hashRecoveryCode, verifyRecoveryCode } from "@/lib/auth/recovery";

describe("recovery codes", () => {
  it("generates ten unique formatted codes by default", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(codes.every((code) => /^[A-F0-9]{4}(?:-[A-F0-9]{4})$/.test(code))).toBe(true);
  });
  it("verifies the original code but not an altered code", async () => {
    const code = generateRecoveryCodes(1)[0];
    const hash = await hashRecoveryCode(code);
    expect(await verifyRecoveryCode(code, hash)).toBe(true);
    expect(await verifyRecoveryCode(code.slice(0, -1) + "0", hash)).toBe(false);
  });
});
