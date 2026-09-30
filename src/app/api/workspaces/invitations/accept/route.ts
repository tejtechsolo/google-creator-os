import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hashOpaqueToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "Invitation token is required." }, { status: 400 });

  const invitation = await db.workspaceInvitation.findUnique({ where: { tokenHash: hashOpaqueToken(token) }, include: { workspace: true } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Invitation is invalid or expired." }, { status: 400 });
  }
  if (invitation.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "This invitation was issued for a different email address." }, { status: 403 });
  }

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.workspaceMembership.findUnique({ where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } } });
    if (existing) {
      await tx.workspaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
      return existing;
    }
    const membership = await tx.workspaceMembership.create({ data: { workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role } });
    await tx.workspaceInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return membership;
  });

  await db.auditLog.create({ data: { userId: user.id, workspaceId: invitation.workspaceId, action: "MEMBER_INVITATION_ACCEPTED", service: "workspace", resourceId: invitation.id, metadata: { role: result.role } } });
  return NextResponse.json({ workspace: invitation.workspace, role: result.role });
}
