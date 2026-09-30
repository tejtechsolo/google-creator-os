# Authentication test strategy

Current unit coverage:
- password hashing and verification
- TOTP generation and verification
- recovery-code generation, hashing and verification
- AES-256-GCM auth-secret encryption
- initial auth rate limiting

Required integration coverage:
- registration and email verification
- login and MFA challenge
- TOTP and recovery-code challenge consumption
- challenge expiration and replay
- password reset revokes sessions
- step-up authentication
- session rotation and sign-out-all

Required E2E coverage:
- registration, verification, and login
- login, MFA, and dashboard
- recovery-code fallback
- password reset
- MFA enrollment

Integration and E2E suites must use isolated test infrastructure and never production credentials.
