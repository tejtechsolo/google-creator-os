# RBAC Integration & E2E Verification

## Scope
This milestone validates workspace tenant isolation against real PostgreSQL and adds the explicit MFA-to-step-up ceremony required by high-risk workspace ownership changes.

## Integration coverage
- Cross-tenant workspace access is denied server-side.
- Viewer permissions remain read-only.
- Non-members cannot satisfy workspace authorization.
- CI provisions PostgreSQL and applies Prisma migrations before tests.

## Step-up ceremony
1. Authenticated user calls POST /api/auth/mfa/step-up.
2. User supplies exactly one verified TOTP or unused recovery code.
3. The server rate-limits attempts and validates the factor server-side.
4. Recovery codes are consumed when used for step-up.
5. A short-lived HttpOnly gcos_step_up cookie is issued for 10 minutes.
6. Sensitive endpoints such as ownership transfer call hasRecentStepUp() before proceeding.

## Remaining E2E work
Browser-level Playwright coverage should be added after the auth pages have a stable test database/bootstrap path. The next milestone should cover registration, MFA, workspace administration, ownership transfer, and cross-tenant denial in a real browser session.