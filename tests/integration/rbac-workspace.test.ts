import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/prisma";
import { hasPermission, requireWorkspacePermission } from "@/lib/auth/authorization";

const enabled = !!process.env.DATABASE_URL;
const suite = enabled ? describe : describe.skip;

suite("workspace RBAC integration", () => {
  let ownerId = "";
  let memberId = "";
  let workspaceId = "";

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    const owner = await db.user.create({ data: { email: "rbac-owner-" + suffix + "@example.test" } });
    const member = await db.user.create({ data: { email: "rbac-member-" + suffix + "@example.test" } });
    ownerId = owner.id;
    memberId = member.id;
    const workspace = await db.workspace.create({
      data: {
        name: "RBAC Integration Test",
        slug: "rbac-integration-" + suffix,
        ownerId,
        memberships: { create: [{ userId: ownerId, role: "OWNER" }, { userId: memberId, role: "VIEWER" }] },
      },
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    if (workspaceId) await db.workspace.delete({ where: { id: workspaceId } });
    if (ownerId) await db.user.deleteMany({ where: { id: { in: [ownerId, memberId] } } });
  });

  it("denies cross-tenant access", async () => {
    const other = await db.user.create({ data: { email: "rbac-outsider-" + Date.now() + "@example.test" } });
    await expect(requireWorkspacePermission(other.id, workspaceId, "workspace:read")).rejects.toMatchObject({ status: 403 });
    await db.user.delete({ where: { id: other.id } });
  });

  it("keeps viewer permissions read-only", () => {
    expect(hasPermission("VIEWER", "content:read")).toBe(true);
    expect(hasPermission("VIEWER", "content:write")).toBe(false);
    expect(hasPermission("VIEWER", "members:remove")).toBe(false);
  });

  it("does not authorize a non-member for workspace access", async () => {
    const outsider = await db.user.create({ data: { email: "rbac-switch-" + Date.now() + "@example.test" } });
    await expect(requireWorkspacePermission(outsider.id, workspaceId, "workspace:read")).rejects.toMatchObject({ status: 403 });
    await db.user.delete({ where: { id: outsider.id } });
  });
});