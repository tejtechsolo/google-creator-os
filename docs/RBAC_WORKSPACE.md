# RBAC and Workspace Isolation

## Purpose

Google Creator OS is multi-tenant. Every authenticated feature that reads or mutates workspace-owned data must establish both:

1. the authenticated user;
2. an active workspace membership;
3. the permission required for the operation.

A workspace id supplied by a browser is never trusted by itself.

## Roles

| Role | Intended responsibility |
|---|---|
| OWNER | Full workspace control, including deletion |
| ADMIN | Workspace and member administration, excluding workspace deletion |
| EDITOR | Content, knowledge, social and YouTube operations |
| SEO_ANALYST | SEO analysis/remediation and related analytics |
| CONTENT_MANAGER | Content lifecycle, publishing and distribution |
| VIEWER | Read-only workspace access |

The permission matrix is centralized in `src/lib/auth/authorization.ts`.

## Authorization contract

Use `requireWorkspacePermission(userId, workspaceId, permission)` in server code before accessing workspace resources.

For authenticated route handlers, `requireAuthenticatedWorkspacePermission(workspaceId, permission)` combines session authentication and authorization.

Do not implement authorization only in the client UI. Hidden buttons are not a security boundary.

## Workspace context

The active workspace is stored in the HttpOnly `gcos_workspace` cookie. The server validates that the current user is a member of that workspace on every privileged operation.

If the cookie is absent or stale, the server selects the user's oldest membership as the fallback context.

The workspace-switch endpoint records `WORKSPACE_SWITCHED` in the audit log.

## Tenant isolation rules

- Never query a workspace resource by resource id alone.
- Prefer composite ownership predicates such as `{ id, workspaceId }` or a repository method that requires workspace id.
- Never accept a user id or workspace id from the client as proof of authorization.
- Every update/delete must re-check membership and permission in the same request.
- Cross-workspace resource ids must resolve as not found/denied rather than leaking whether another tenant owns them.
- Background jobs must carry an immutable workspace id and re-authorize before executing workspace mutations.
- Provider integrations and OAuth credentials must eventually be scoped to a workspace, not just a user, when shared workspace features are introduced.

## Registration bootstrap

New password registrations create a personal workspace and an OWNER membership in the same database transaction. This avoids partially provisioned accounts.

## Future membership APIs

The next RBAC increment should add:

- invite member
- accept invitation
- list members
- change member role
- remove member
- transfer ownership
- prevent removal/demotion of the final owner
- step-up authentication for ownership/security changes
- audit events for every membership mutation

## Testing requirements

Required before the RBAC milestone is production-ready:

- role/permission unit tests
- workspace membership integration tests
- cross-tenant read denial
- cross-tenant update/delete denial
- stale workspace cookie fallback
- unauthorized workspace switching denial
- final-owner protection
- background-job tenant isolation
- E2E tests for workspace switching and member administration

## Migration / rollback

Migration: `20260930170000_rbac_workspace`.

Forward migration creates the WorkspaceRole enum, Workspace and WorkspaceMembership tables, workspace indexes, and the optional AuditLog workspace relation.

Before production deployment, take a database backup and verify the migration in staging. Rollback should be a controlled database migration procedure rather than deleting production tables manually.
