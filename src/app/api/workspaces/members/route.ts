import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireWorkspacePermission } from "@/lib/auth/authorization";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { sendWorkspaceInvitationEmail } from "@/lib/auth/email";

const ROLES = ["ADMIN", "EDITOR", "SEO_ANALYST", "CONTENT_MANAGER", "VIEWER"] as const;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
  await requireWorkspacePermission(user.id, workspaceId, "members:read");

  const members = await db.workspaceMembership.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, email: true, name: true, image: true, emailVerifiedAt: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  const invitations = await db.workspaceInvitation.findMany({
    where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ members, invitations });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = typeof body?.role === "string" ? body.role : "";
  if (!workspaceId || !email || !ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json({ error: "workspaceId, email and a valid role are required." }, { status: 400 });
  }
  await requireWorkspacePermission(user.id, workspaceId, "members:invite");

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    const member = await db.workspaceMembership.findUnique({ where: { workspaceId_userId: { workspaceId, userId: existing.id } } });
    if (member) return NextResponse.json({ error: "User is already a workspace member." }, { status: 409 });
  }

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

  const rawToken = createOpaqueToken();
  const invitation = await db.workspaceInvitation.create({
    data: {
      workspaceId, email, role: role as (typeof ROLES)[number],
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt: new Date(Date.now() + TTL_MS),
      invitedById: user.id,
    },
    select: { id: true, email: true, role: true, expiresAt: true },
  });

  try {
    await sendWorkspaceInvitationEmail(email, rawToken, workspace.name);
  } catch {
    await db.workspaceInvitation.delete({ where: { id: invitation.id } });
    return NextResponse.json({ error: "Unable to deliver invitation." }, { status: 502 });
  }

  await db.auditLog.create({ data: { userId: user.id, workspaceId, action: "MEMBER_INVITED", service: "workspace", resourceId: invitation.id, metadata: { role } } });
  return NextResponse.json({ invitation }, { status: 201 });
}
