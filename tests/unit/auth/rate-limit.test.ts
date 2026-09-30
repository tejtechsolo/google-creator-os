import { describe, expect, it } from "vitest";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

describe("auth rate limiter", () => {
  it("enforces the configured limit", () => {
    const key = "test-" + Date.now() + "-" + Math.random();
    expect(allowAuthAttempt(key, 2, 60_000)).toBe(true);
    expect(allowAuthAttempt(key, 2, 60_000)).toBe(true);
    expect(allowAuthAttempt(key, 2, 60_000)).toBe(false);
  });
});
