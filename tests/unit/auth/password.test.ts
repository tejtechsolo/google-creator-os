import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies the correct password", async () => {
    const hash = await hashPassword("StrongPassword123!");
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword("StrongPassword123!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123!", hash)).toBe(false);
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("password", "not-a-hash")).toBe(false);
  });
});
