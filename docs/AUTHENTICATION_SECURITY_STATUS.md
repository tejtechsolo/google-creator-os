# Authentication & Security Status

## Implemented foundation

- Opaque database-backed sessions with hashed session tokens.
- Password credential, email-verification-token, password-reset-token, TOTP-factor and recovery-code persistence models.
- Opaque token generation and SHA-256 hashing helpers.
- Public sitemap and robots policy.
- Baseline browser security headers.

## Not yet production-complete

The following require server-side implementation and automated tests before production:

- Email/password registration and login handlers.
- Email delivery for verification and password reset.
- TOTP enrollment, verification and step-up authentication.
- Recovery-code verification and regeneration.
- Session rotation and sign-out-all-sessions.
- Login/reset rate limiting and abuse controls.
- Workspace membership and RBAC enforcement.
- WebAuthn/passkeys.
- CSP nonce-based script policy where required by the final UI.
- Security integration/E2E tests.

## Rules

1. Passwords and MFA secrets are never logged.
2. Reset and verification tokens are random, short-lived, single-use opaque values; only hashes belong in the database.
3. Recovery codes are shown only at generation time and stored as hashes.
4. Sensitive external actions require explicit authorization and audit logging.
5. Authorization is enforced server-side; UI visibility is not a security boundary.
6. Authentication changes require unit, integration and E2E/security coverage.

## Migration

The authentication persistence migration is:

`prisma/migrations/20260930090000_auth_foundation/migration.sql`

Run migrations only against the intended environment and verify backup/rollback procedures before production changes.
