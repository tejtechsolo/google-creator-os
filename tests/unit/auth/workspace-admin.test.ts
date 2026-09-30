import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/auth/authorization";

describe("workspace administration security", () => {
  it("does not grant owner-only workspace deletion to admins", () => {
    expect(hasPermission("ADMIN", "workspace:delete")).toBe(false);
  });

  it("allows owners to manage membership", () => {
    expect(hasPermission("OWNER", "members:invite")).toBe(true);
    expect(hasPermission("OWNER", "members:update")).toBe(true);
    expect(hasPermission("OWNER", "members:remove")).toBe(true);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission("VIEWER", "members:read")).toBe(false);
    expect(hasPermission("VIEWER", "content:write")).toBe(false);
    expect(hasPermission("VIEWER", "analytics:read")).toBe(true);
  });
});
