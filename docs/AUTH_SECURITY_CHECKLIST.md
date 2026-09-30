# Google Creator OS — Authentication Security Checklist

## Current status
Authentication is still a development milestone. Do not treat it as production-ready until the release gates pass.

## MFA
- TOTP challenge is short-lived and single-use.
- Recovery codes are hashed and consumed once.
- MFA login must create an authenticated session only after successful MFA.
- TOTP secrets are encrypted at rest with AES-256-GCM; `AUTH_ENCRYPTION_KEY` is mandatory.
- Login MFA challenges carry an explicit `LOGIN` purpose and are atomically consumed to prevent replay races.
- Step-up tokens are persisted server-side with an explicit `STEP_UP` purpose and a short TTL.
- TOTP secrets created by enrollment and used by verification are encrypted/decrypted through the shared auth encryption helper.
- MFA enrollment/removal should require recent re-authentication before those management endpoints are considered production-ready.
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
