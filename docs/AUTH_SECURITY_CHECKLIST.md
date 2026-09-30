# Google Creator OS — Authentication Security Checklist

## Current status
Authentication is still a development milestone. Do not treat it as production-ready until the release gates pass.

## MFA
- TOTP challenge is short-lived and single-use.
- Recovery codes are hashed and consumed once.
- MFA login must create an authenticated session only after successful MFA.
- TOTP secrets must be encrypted at rest before production.
- MFA enrollment/removal should require recent re-authentication.
- MFA verification requires durable/distributed throttling before scale.

## Sessions
- Sessions use opaque random tokens with SHA-256 hashes stored server-side.
- Password reset revokes all sessions.
- Authentication-level changes should rotate sessions.
- Expired sessions should be cleaned up through scheduled maintenance.

## Environment
Required production secrets should be generated and stored in the deployment secret manager:
- DATABASE_URL
- AUTH_ENCRYPTION_KEY
- NEXT_PUBLIC_APP_URL
- RESEND_API_KEY
- AUTH_EMAIL_FROM

Never commit real values.

## Verification gates
Run typecheck, unit/integration tests, dependency/security scans, migration validation, and staging authentication flows before merging to main.
