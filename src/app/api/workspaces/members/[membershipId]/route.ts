import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { requireWorkspacePermission } from "@/lib/auth/authorization";
import { hasRecentStepUp } from "@/lib/auth/step-up";
import { WorkspaceRole } from "@prisma/client";

const ASSIGNABLE = new Set<WorkspaceRole>(["ADMIN","EDITOR","SEO_ANALYST","CONTENT_MANAGER","VIEWER"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { membershipId } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role as WorkspaceRole;
  if (!ASSIGNABLE.has(role)) return NextResponse.json({ error: "Invalid assignable role." }, { status: 400 });

  const target = await db.workspaceMembership.findUnique({ where: { id: membershipId } });
  if (!target) return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  const actor = await requireWorkspacePermission(user.id, target.workspaceId, "members:update");

  if (target.role === "OWNER" || role === "OWNER") {
    if (actor.role !== "OWNER" || !(await hasRecentStepUp(user.id))) {
      return NextResponse.json({ error: "Recent step-up authentication is required for ownership changes." }, { status: 403 });
    }
    return NextResponse.json({ error: "Use the ownership transfer operation for OWNER changes." }, { status: 400 });
  }

  const updated = await db.workspaceMembership.update({ where: { id: membershipId }, data: { role }, select: { id: true, userId: true, workspaceId: true, role: true } });
  await db.auditLog.create({ data: { userId: user.id, workspaceId: target.workspaceId, action: "MEMBER_ROLE_CHANGED", service: "workspace", resourceId: membershipId, metadata: { from: target.role, to: role } } });
  return NextResponse.json({ membership: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ membershipId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { membershipId } = await params;
  const target = await db.workspaceMembership.findUnique({ where: { id: membershipId } });
  if (!target) return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  await requireWorkspacePermission(user.id, target.workspaceId, "members:remove");

  if (target.role === "OWNER") return NextResponse.json({ error: "The owner cannot be removed. Transfer ownership first." }, { status: 409 });
  if (target.userId === user.id) return NextResponse.json({ error: "Use a leave-workspace flow instead." }, { status: 400 });

  await db.workspaceMembership.delete({ where: { id: membershipId } });
  await db.auditLog.create({ data: { userId: user.id, workspaceId: target.workspaceId, action: "MEMBER_REMOVED", service: "workspace", resourceId: membershipId, metadata: { removedUserId: target.userId } } });
  return NextResponse.json({ success: true });
}
