import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { requireWorkspacePermission, type Permission } from "@/lib/auth/authorization";

const WORKSPACE_COOKIE = "gcos_workspace";
const COOKIE_DAYS = 30;

export async function getActiveWorkspaceId() {
  return (await cookies()).get(WORKSPACE_COOKIE)?.value ?? null;
}

export async function getActiveWorkspace(userId: string) {
  const workspaceId = await getActiveWorkspaceId();
  if (workspaceId) {
    const membership = await db.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (membership) return membership;
  }

  return db.workspaceMembership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireActiveWorkspace(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTHENTICATION_REQUIRED");
  const membership = await getActiveWorkspace(user.id);
  if (!membership) throw new Error("WORKSPACE_REQUIRED");
  const authorized = await requireWorkspacePermission(user.id, membership.workspaceId, permission);
  return { user, membership: authorized };
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_DAYS * 86400,
  });
}
