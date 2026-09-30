import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import type { WorkspaceRole } from "@prisma/client";

export type Permission =
  | "workspace:read"
  | "workspace:update"
  | "workspace:delete"
  | "members:read"
  | "members:invite"
  | "members:update"
  | "members:remove"
  | "content:read"
  | "content:write"
  | "content:publish"
  | "seo:read"
  | "seo:write"
  | "social:read"
  | "social:publish"
  | "youtube:read"
  | "youtube:publish"
  | "integrations:read"
  | "integrations:manage"
  | "automation:read"
  | "automation:manage"
  | "analytics:read"
  | "knowledge:read"
  | "knowledge:write"
  | "settings:read"
  | "settings:update";

const ALL: readonly Permission[] = [
  "workspace:read","workspace:update","workspace:delete","members:read","members:invite",
  "members:update","members:remove","content:read","content:write","content:publish",
  "seo:read","seo:write","social:read","social:publish","youtube:read","youtube:publish",
  "integrations:read","integrations:manage","automation:read","automation:manage",
  "analytics:read","knowledge:read","knowledge:write","settings:read","settings:update",
];

const ROLE_PERMISSIONS: Record<WorkspaceRole, readonly Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((p) => p !== "workspace:delete"),
  EDITOR: ["workspace:read","members:read","content:read","content:write","content:publish","social:read","social:publish","youtube:read","youtube:publish","knowledge:read","knowledge:write","analytics:read"],
  SEO_ANALYST: ["workspace:read","members:read","seo:read","seo:write","analytics:read","knowledge:read","content:read"],
  CONTENT_MANAGER: ["workspace:read","members:read","content:read","content:write","content:publish","social:read","social:publish","youtube:read","youtube:publish","knowledge:read","knowledge:write","analytics:read"],
  VIEWER: ["workspace:read","content:read","seo:read","social:read","youtube:read","integrations:read","automation:read","analytics:read","knowledge:read","settings:read"],
};

export class AuthorizationError extends Error {
  status: 401 | 403 | 404;
  constructor(message: string, status: 401 | 403 | 404) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function getWorkspaceMembership(userId: string, workspaceId: string) {
  return db.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });
}

export function hasPermission(role: WorkspaceRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: Permission,
) {
  const membership = await getWorkspaceMembership(userId, workspaceId);
  if (!membership) throw new AuthorizationError("Workspace access denied.", 403);
  if (!hasPermission(membership.role, permission)) {
    throw new AuthorizationError("Insufficient workspace permission.", 403);
  }
  return membership;
}

export async function requireAuthenticatedWorkspacePermission(
  workspaceId: string,
  permission: Permission,
) {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Authentication required.", 401);
  return requireWorkspacePermission(user.id, workspaceId, permission);
}

export function permissionsForRole(role: WorkspaceRole) {
  return [...ROLE_PERMISSIONS[role]];
}
