import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { setActiveWorkspaceCookie } from "@/lib/auth/workspace";
import { requireWorkspacePermission } from "@/lib/auth/authorization";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const memberships = await db.workspaceMembership.findMany({
    where: { userId: user.id },
    select: {
      workspaceId: true,
      role: true,
      workspace: { select: { id: true, name: true, slug: true, ownerId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });

  const membership = await requireWorkspacePermission(user.id, workspaceId, "workspace:read");
  await setActiveWorkspaceCookie(workspaceId);

  await db.auditLog.create({
    data: {
      userId: user.id,
      workspaceId,
      action: "WORKSPACE_SWITCHED",
      service: "workspace",
      resourceId: workspaceId,
    },
  });

  return NextResponse.json({
    workspace: { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug },
    role: membership.role,
  });
}
