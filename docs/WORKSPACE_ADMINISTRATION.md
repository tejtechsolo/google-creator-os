# Workspace Administration

## Implemented

Workspace administration now supports:

- member listing
- pending invitation listing
- email invitations with 7-day expiry
- invitation acceptance for the invited email
- role changes for non-owner memberships
- member removal
- owner protection
- ownership transfer
- audit events
- step-up authentication requirement for ownership changes

## Security rules

### Invitations
Invitation tokens are opaque, stored only as SHA-256 hashes, expire after seven days, and are marked accepted transactionally with membership creation.

An invitation can only be accepted by an authenticated account whose email exactly matches the invited email.

### Roles
OWNER is not assignable through the normal role-change API. Ownership transfer is a separate operation.

ADMIN, EDITOR, SEO_ANALYST, CONTENT_MANAGER and VIEWER can be assigned through the member role endpoint, subject to the actor's `members:update` permission.

### Owner protection
The owner cannot be removed.

Ownership transfer requires:

1. current authenticated owner;
2. workspace membership;
3. workspace update permission;
4. recent step-up authentication;
5. target user already being a workspace member.

The transfer changes workspace ownership and the membership roles in one database transaction.

### Tenant isolation

Every membership operation resolves the target membership first and then authorizes against that membership's workspace. Client-provided workspace identifiers never bypass the membership check.

## API

- `GET /api/workspaces/members?workspaceId=...`
- `POST /api/workspaces/members`
- `PATCH /api/workspaces/members/:membershipId`
- `DELETE /api/workspaces/members/:membershipId`
- `POST /api/workspaces/invitations/accept`
- `POST /api/workspaces/ownership`

## UI

Member administration is available at:

`/settings/workspace/members`

The UI is deliberately not treated as a security boundary; all permission checks occur server-side.

## Remaining hardening

Before production:

- add resend/revoke invitation endpoints
- add CSRF strategy for state-changing browser requests
- add distributed rate limiting for invitation abuse
- add integration tests against PostgreSQL
- add E2E tests for cross-tenant access
- add explicit reauthentication/MFA ceremony that grants the existing STEP_UP challenge
- add session invalidation when high-risk membership changes require it
