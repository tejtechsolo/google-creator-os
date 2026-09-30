import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireWorkspacePermission } from "@/lib/auth/authorization";
import { hasRecentStepUp } from "@/lib/auth/step-up";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
  const newOwnerUserId = typeof body?.newOwnerUserId === "string" ? body.newOwnerUserId : "";
  if (!workspaceId || !newOwnerUserId) return NextResponse.json({ error: "workspaceId and newOwnerUserId are required." }, { status: 400 });

  const actor = await requireWorkspacePermission(user.id, workspaceId, "workspace:update");
  if (actor.role !== "OWNER" || !(await hasRecentStepUp(user.id))) {
    return NextResponse.json({ error: "Owner step-up authentication is required." }, { status: 403 });
  }
  if (newOwnerUserId === user.id) return NextResponse.json({ error: "The current owner already owns this workspace." }, { status: 400 });

  const target = await db.workspaceMembership.findUnique({ where: { workspaceId_userId: { workspaceId, userId: newOwnerUserId } } });
  if (!target) return NextResponse.json({ error: "New owner must already be a workspace member." }, { status: 400 });

  await db.$transaction(async (tx) => {
    await tx.workspace.update({ where: { id: workspaceId }, data: { ownerId: newOwnerUserId } });
    await tx.workspaceMembership.update({ where: { id: target.id }, data: { role: "OWNER" } });
    await tx.workspaceMembership.update({ where: { workspaceId_userId: { workspaceId, userId: user.id } }, data: { role: "ADMIN" } });
  });

  await db.auditLog.create({ data: { userId: user.id, workspaceId, action: "WORKSPACE_OWNERSHIP_TRANSFERRED", service: "workspace", resourceId: workspaceId, metadata: { fromUserId: user.id, toUserId: newOwnerUserId } } });
  return NextResponse.json({ success: true, ownerId: newOwnerUserId });
}
