import { describe, expect, it } from "vitest";
import { hasPermission, permissionsForRole } from "@/lib/auth/authorization";

describe("workspace RBAC", () => {
  it("grants owner all permissions", () => {
    expect(hasPermission("OWNER", "workspace:delete")).toBe(true);
    expect(hasPermission("OWNER", "members:remove")).toBe(true);
    expect(hasPermission("OWNER", "integrations:manage")).toBe(true);
  });

  it("prevents admin from deleting the workspace", () => {
    expect(hasPermission("ADMIN", "workspace:update")).toBe(true);
    expect(hasPermission("ADMIN", "workspace:delete")).toBe(false);
  });

  it("limits SEO analysts to SEO/read-oriented permissions", () => {
    expect(hasPermission("SEO_ANALYST", "seo:write")).toBe(true);
    expect(hasPermission("SEO_ANALYST", "content:publish")).toBe(false);
    expect(hasPermission("SEO_ANALYST", "integrations:manage")).toBe(false);
  });

  it("limits viewers to read access", () => {
    expect(hasPermission("VIEWER", "content:read")).toBe(true);
    expect(hasPermission("VIEWER", "content:write")).toBe(false);
    expect(hasPermission("VIEWER", "members:remove")).toBe(false);
  });

  it("returns a defensive copy of role permissions", () => {
    const permissions = permissionsForRole("EDITOR");
    permissions.push("workspace:delete");
    expect(hasPermission("EDITOR", "workspace:delete")).toBe(false);
  });
});
